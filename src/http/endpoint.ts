import { hashEndpoint } from './utils/hash';
import { InputNode, SourceValues, NodeValue } from '../core/inputNode';
import debug from 'debug';
import { ReqBuilder } from './reqBuilder';
import http, { SUPPORTED_METHOD_UPPERCASE } from './utils/client';
import { Dispatcher } from 'undici';
import {
  InvalidResponseError,
  RequiredValuesNotFoundError,
  UnsupportedMethodError,
} from './errors';
import { SUPPORTED_METHOD, SUPPORTED_METHODS } from './endpointFactory';
import { CallOpts, SEED_HASH } from './chainflow';
import deepmergeSetup from '@fastify/deepmerge';
import { SourceNode, SourceNodeHandler } from '../core/source';
import { getNodeValue, nodeValueIdentifier } from '../core/utils/symbols';
import { required } from '../core/utils/initializers';

const deepmerge = deepmergeSetup();

const log = debug('chainflow:endpoint');

const PATH_PARAM_REGEX = /\/(\{[^{}]+\})/g;

export interface INodeWithValue {
  [nodeValueIdentifier]: NodeValue;
}

/** Describes all the possible input nodes of a HTTP request. */
export interface HttpInputNodes {
  pathParams: InputNode;
  body: InputNode;
  query: InputNode;
  headers: InputNode;
}

/** Special object used to link a InputNode to a chainflow seed. */
export const seed = new Proxy(
  { path: [], hash: SEED_HASH },
  SourceNodeHandler,
) as unknown as SourceNode;

/**
 * Manages request and response nodes,
 * as well as calls to that endpoint
 */
export class Endpoint {
  #addr: string = '127.0.0.1';
  #path: string;
  #method: SUPPORTED_METHOD;
  #req: ReqBuilder;
  #resp: SourceNode;

  constructor({ addr, method, path }: { addr: string; method: string; path: string }) {
    method = method.toLowerCase();
    if (!SUPPORTED_METHODS.includes(method as SUPPORTED_METHOD))
      throw new UnsupportedMethodError(method);
    this.#addr = addr;
    this.#path = path;
    this.#method = method as SUPPORTED_METHOD;
    this.#req = new ReqBuilder({ hash: this.getHash() });
    this.#extractPathParams();
    this.#resp = new Proxy(
      { path: [], hash: this.getHash() },
      SourceNodeHandler,
    ) as unknown as SourceNode;
  }

  get method() {
    return this.#method;
  }

  /** Returns a hash that uniquely identifies this endpoint. */
  getHash() {
    return hashEndpoint({ route: this.#path, method: this.#method });
  }

  /** Sets the request body. */
  body(payload: any) {
    this.#req.body = payload;
    return this;
  }

  get resp() {
    return this.#resp;
  }

  /** Sets the request query parameters. */
  query(params: any) {
    this.#req.query = params;
    return this;
  }

  /** Sets custom headers for requests. */
  headers(params: Record<string, string | INodeWithValue | undefined>) {
    this.#req.headers = params;
    return this;
  }

  /** Sets headers provided by the factory. */
  baseHeaders(node: InputNode) {
    this.#req.baseHeaders = node;
    return this;
  }

  /** Calls this endpoint with responses provided from earlier requests in the chain. */
  async call(responses: SourceValues, opts?: CallOpts): Promise<any> {
    const method = this.#method.toUpperCase() as SUPPORTED_METHOD_UPPERCASE;

    let body = {};
    const missingValues: string[][] = []; // contains path of missing required values
    if (method !== 'GET') body = this.#req.body[getNodeValue](responses, missingValues, ['body']);

    let callPath = this.#path;

    let pathParams = {};
    if (Object.keys(this.#req.pathParams).length > 0) {
      pathParams = this.#req.pathParams[getNodeValue](responses, missingValues, ['pathParams']);
    }

    let queryParams = {};
    if (Object.keys(this.#req.query).length > 0) {
      queryParams = this.#req.query[getNodeValue](responses, missingValues, ['queryParams']);
    }

    const baseHeaders = this.#req.baseHeaders[getNodeValue](responses, missingValues, ['headers']);
    let headers = this.#req.headers[getNodeValue](responses, missingValues, ['headers']);
    baseHeaders && (headers = deepmerge(baseHeaders, headers));

    const finalMissingValues = this.#findMissingValues(missingValues, opts);
    if (finalMissingValues.length > 0)
      throw new RequiredValuesNotFoundError(this.getHash(), finalMissingValues);

    if (opts?.body) body = deepmerge(body, opts.body);
    if (opts?.pathParams) pathParams = deepmerge(pathParams, opts.pathParams);
    if (opts?.query) queryParams = deepmerge(queryParams, opts.query);
    if (opts?.headers) headers = deepmerge(headers, opts.headers);

    callPath = this.#insertPathParams(callPath, pathParams);
    callPath = this.#insertQueryParams(callPath, queryParams);

    const resp = await http.httpReq({
      addr: this.#addr,
      path: callPath,
      method: this.#method.toUpperCase() as SUPPORTED_METHOD_UPPERCASE,
      body: body && JSON.stringify(body),
      headers,
    });

    if (resp == null || !this.#validateResp(resp)) throw new InvalidResponseError();

    return resp?.body.json();
  }

  /** Configure linking of this Req's input nodes. */
  set(setter: (nodes: HttpInputNodes) => void) {
    setter({
      pathParams: this.#req.pathParams,
      body: this.#req.body,
      query: this.#req.query,
      headers: this.#req.headers,
    });
    return this;
  }

  /** Extracts Path params from a given path */
  #extractPathParams() {
    const pathParamRegex = new RegExp(PATH_PARAM_REGEX);
    const hash = this.getHash();
    let param;
    const params: Record<string, object> = {};
    while ((param = pathParamRegex.exec(this.#path)) !== null && typeof param[1] === 'string') {
      const paramName = param[1].replace('{', '').replace('}', '');
      log(`Found path parameter InputNode for hash "${hash}" with name "${paramName}"`);
      params[paramName] = required();
    }
    this.#req.pathParams = new InputNode({
      val: params,
      hash,
    });
  }

  /** Inserts actual path params into path. */
  #insertPathParams(path: string, pathParams: Record<string, string>): string {
    Object.entries(pathParams).forEach(([name, val]) => {
      path = path.replace(`{${name}}`, val);
    });
    return path;
  }

  /** Inserts actual query params into path. */
  #insertQueryParams(path: string, queryParams: Record<string, string>): string {
    if (Object.keys(queryParams).length > 0) path = `${path}?`;
    Object.entries(queryParams).forEach(([name, val], i) => {
      path = `${path}${i >= 1 ? '&' : ''}${name}=${val}`;
    });
    return path;
  }

  /** Checks that endpoint call succeeded -
   * request did not throw error,
   * and status code is within 200 - 299. */
  #validateResp(resp: Dispatcher.ResponseData): boolean {
    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      log(`Request failed with status code: ${resp.statusCode}`);
      return false;
    }
    return true;
  }

  /** Looks for missing values in provided object. */
  #findMissingValues(missingValues: string[][], obj?: Record<string, any>) {
    const finalMissingValues: string[] = [];
    for (const path of missingValues) {
      if (obj === undefined) {
        finalMissingValues.push(path.join('.'));
        continue;
      }
      let state = obj;
      for (const accessor of path) {
        state = state[accessor];
        if (state === undefined) {
          finalMissingValues.push(path.join('.'));
          break;
        }
      }
    }
    return finalMissingValues;
  }
}
