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
import { CallOpts, IEndpoint } from '../core/chainflow';
import deepmergeSetup from '@fastify/deepmerge';
import { SourceNode, sourceNode } from '../core/sourceNode';
import { getNodeValue, nodeValueIdentifier } from '../core/utils/symbols';
import { required } from '../core/utils/initializers';
import BodyReadable from 'undici/types/readable';

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

/** Configurations for the endpoint. */
export interface EndpointConfig {
  respParser?: `${RespParser}`;
  respValidator?: (resp: Dispatcher.ResponseData) => {
    valid: boolean;
    msg?: string;
  };
}

/** Formats to parse the response body. */
export enum RespParser {
  ArrayBuffer = 'arrayBuffer',
  Blob = 'blob',
  Json = 'json',
  Text = 'text',
}

/**
 * Manages request and response nodes,
 * as well as calls to that endpoint
 */
export class Endpoint implements IEndpoint {
  #addr: string = '127.0.0.1';
  #path: string;
  #method: SUPPORTED_METHOD;
  #req: ReqBuilder;
  #resp: SourceNode;
  #config: EndpointConfig = {};
  /** A hash that uniquely identifies this endpoint. */
  hash: string;

  constructor({ addr, method, path }: { addr: string; method: string; path: string }) {
    method = method.toLowerCase();
    if (!SUPPORTED_METHODS.includes(method as SUPPORTED_METHOD))
      throw new UnsupportedMethodError(method);
    this.#addr = addr;
    this.#path = path;
    this.#method = method as SUPPORTED_METHOD;
    this.hash = hashEndpoint({ route: this.#path, method: this.#method });
    this.#req = new ReqBuilder({ hash: this.hash });
    this.#extractPathParams();
    this.#resp = sourceNode(this.hash);
  }

  get method() {
    return this.#method;
  }

  config(config: EndpointConfig) {
    this.#config = config;
    return this;
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
      throw new RequiredValuesNotFoundError(this.hash, finalMissingValues);

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

    if (resp == null) throw new InvalidResponseError('No response received.');
    const results = this.#config.respValidator?.(resp) ?? this.#validateResp(resp);
    if (!results.valid) throw new InvalidResponseError(results.msg);

    return {
      ...resp,
      body: await this.#parseResponse(resp.body),
    };
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
    const hash = this.hash;
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
  #validateResp(resp: Dispatcher.ResponseData): { valid: boolean; msg?: string } {
    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      log(`Request failed with status code: ${resp.statusCode}`);
      return { valid: false, msg: `Received HTTP status code ${resp.statusCode}` };
    }
    return { valid: true };
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

  /** Parses a response body according to the endpoint config. */
  async #parseResponse(body: BodyReadable) {
    switch (this.#config.respParser) {
      case RespParser.ArrayBuffer:
        return await body.arrayBuffer();
      case RespParser.Blob:
        return await body.blob();
      case RespParser.Text:
        return await body.text();
      case RespParser.Json:
      default:
        return await body.json();
    }
  }
}
