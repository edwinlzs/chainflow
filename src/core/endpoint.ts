import { hashEndpoint } from '../utils/hash';
import { ReqNode } from './reqNode';
import debug from 'debug';
import { ReqBuilder } from './reqBuilder';
import http, { SUPPORTED_METHOD_UPPERCASE } from '../utils/http';
import { Dispatcher } from 'undici';
import { getNodeValue, nodeHash, nodePath } from '../utils/symbols';
import { InvalidResponseError, UnsupportedMethodError } from './errors';
import { SUPPORTED_METHOD, SUPPORTED_METHODS } from './endpointFactory';
import { CallOpts, Responses, SEED_HASH } from './chainflow';
import deepmergeSetup from '@fastify/deepmerge';

const deepmerge = deepmergeSetup();

const log = debug('chainflow:endpoint');

const PATH_PARAM_REGEX = /\/(\{[^{}]+\})/g;

/** Describes all the possible input nodes of a HTTP request. */
export interface InputNodes {
  pathParams: ReqNode;
  body: ReqNode;
  query: ReqNode;
  headers: ReqNode;
}

/** Describes a value in the output of an endpoint call. */
export interface OutputNode {
  [nodeHash]: string;
  [nodePath]: string[];
  [key: string]: any;
}

/** Generates proxies recursively to handle nested property access of a response signature. */
const RespNodeHandler = {
  get(obj: { path: string[]; hash: string }, prop: any): any {
    if (prop === nodePath) return obj.path;
    if (prop === nodeHash) return obj.hash;
    const newPath = [...obj.path];
    newPath.push(prop);
    return new Proxy(
      {
        path: newPath,
        hash: obj.hash,
      },
      RespNodeHandler,
    ) as unknown as OutputNode;
  },
};

/** Special object used to link a ReqNode to a chainflow seed. */
export const seed = new Proxy(
  { path: [], hash: SEED_HASH },
  RespNodeHandler,
) as unknown as OutputNode;

/**
 * Manages request and response nodes,
 * as well as calls to that endpoint
 */
export class Endpoint {
  #addr: string = '127.0.0.1';
  #path: string;
  #method: SUPPORTED_METHOD;
  #req: ReqBuilder;
  #resp: OutputNode;

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
      RespNodeHandler,
    ) as unknown as OutputNode;
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
  headers(params: Record<string, string>) {
    this.#req.headers = params;
    return this;
  }

  /** Calls this endpoint with responses provided from earlier requests in the chain. */
  async call(responses: Responses, opts?: CallOpts): Promise<any> {
    const method = this.#method.toUpperCase() as SUPPORTED_METHOD_UPPERCASE;

    let body = {};
    if (method !== 'GET') body = this.#req.body[getNodeValue](responses);
    if (opts?.body) body = deepmerge(body, opts.body);

    let callPath = this.#path;

    let pathParams = {};
    if (this.#req.pathParams && Object.keys(this.#req.pathParams).length > 0) {
      pathParams = this.#req.pathParams[getNodeValue](responses);
    }
    if (opts?.pathParams) pathParams = deepmerge(pathParams, opts.pathParams);
    callPath = this.#insertPathParams(callPath, pathParams);

    let queryParams = {};
    if (this.#req.query && Object.keys(this.#req.query).length > 0) {
      queryParams = this.#req.query[getNodeValue](responses);
    }
    if (opts?.query) queryParams = deepmerge(queryParams, opts.query);
    callPath = this.#insertQueryParams(callPath, queryParams);

    let headers = this.#req.headers[getNodeValue](responses);
    if (opts?.headers) headers = deepmerge(headers, opts.headers);

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
  set(setter: (nodes: InputNodes) => void) {
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
    while ((param = pathParamRegex.exec(this.#path)) !== null && typeof param[1] === 'string') {
      const paramName = param[1].replace('{', '').replace('}', '');
      log(`Found path parameter ReqNode for hash "${hash}" with name "${paramName}"`);
      this.#req.pathParams[paramName] = new ReqNode({
        val: paramName,
        hash,
      });
    }
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
}
