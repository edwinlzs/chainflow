import { hashEndpoint } from '../utils/hash.js';
import { SUPPORTED_METHOD, SUPPORTED_METHODS, Responses } from './chainflow.js';
import { ReqNode, getNodeValue, nodeHash, setSource } from './reqNode.js';
import debug from 'debug';
import { ReqBuilder, ReqNodes } from './reqBuilder.js';
import { RespNode } from './respNode.js';
import http, { SUPPORTED_METHOD_UPPERCASE } from '../utils/http.js';

const log = debug('chainflow:endpoint');

type RespNodes = { [key: string]: RespNode };

const PATH_PARAM_REGEX = /\/(\{[^{}]+\})/g;

/** Describes all the possible input nodes of a HTTP request. */
export interface InputNodes {
  pathParams: ReqNodes;
  body: ReqNodes;
  query: ReqNodes;
}

/**
 * Manages request and response nodes,
 * as well as calls to that endpoint
 */
export class Endpoint {
  #address: string = '127.0.0.1';
  #path: string;
  #method: SUPPORTED_METHOD;
  #req: ReqBuilder;
  #res: RespNodes = {};
  /** Temporarily substitutes a real response from calling an API. */
  #tempRes: any;

  constructor({ path, method }: { path: string; method: string }) {
    method = method.toLowerCase();
    if (!SUPPORTED_METHODS.includes(method as SUPPORTED_METHOD))
      throw new Error(`Unsupported method: "${method}"`);
    this.#path = path;
    this.#method = method as SUPPORTED_METHOD;
    this.#req = new ReqBuilder({ hash: this.getHash() });
    this.#extractPathParams();
  }

  set address(address: string) {
    this.#address = address;
  }

  get method() {
    return this.#method;
  }

  /** Returns a hash that uniquely identifies this endpoint. */
  getHash() {
    return hashEndpoint({ route: this.#path, method: this.#method });
  }

  /** Sets the request body. */
  set body(payload: any) {
    this.#req.body = payload;
  }

  set res(payload: any) {
    this.#tempRes = payload;
    const hash = this.getHash();
    Object.entries(payload).forEach(([key, val]) => {
      log(`Creating RespNode for hash "${hash}" with path "${key}"`);
      this.#res[key] = new RespNode({
        val,
        hash,
        path: key,
      });
    });
  }

  get res() {
    return this.#res;
  }

  /** Calls this endpoint with responses provided from earlier requests in the chain. */
  async call(responses: any): Promise<any> {
    const method = this.#method.toUpperCase() as SUPPORTED_METHOD_UPPERCASE;
    let body = undefined;
    if (method !== 'GET') body = this.#buildPayload(responses);
    let callPath = this.#path;
    if (Object.keys(this.#req.pathParams).length > 0) {
      callPath = this.#insertPathParams(callPath, this.#buildPathParams(responses));
    }
    if (Object.keys(this.#req.query).length > 0) {
      callPath = this.#insertQueryParams(callPath, this.#buildQueryParams(responses));
    }
    await http.httpReq({
      addr: this.#address,
      path: callPath,
      method: this.#method.toUpperCase() as SUPPORTED_METHOD_UPPERCASE,
      body,
    });

    return this.#tempRes;
  }

  /** Configure linking of this Req's input nodes. */
  set(setter: (link: (dest: ReqNode, source: RespNode) => void, nodes: InputNodes) => void) {
    setter(link, {
      pathParams: this.#req.pathParams,
      body: this.#req.body,
      query: this.#req.query,
    });
  }

  /** Builds the request payload */
  #buildPayload(responses: Responses) {
    return buildObject(this.#req.body, responses);
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

  /** Gets path params key-value pairs for making an endpoint call. */
  #buildPathParams(responses: Responses) {
    return buildObject(this.#req.pathParams, responses);
  }

  /** Gets query params key-value pairs for making an endpoint call. */
  #buildQueryParams(responses: Responses) {
    return buildObject(this.#req.query, responses);
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
      path = `${path}${i > 1 ? '&' : ''}${name}=${val}`;
    });
    return path;
  }

  /** Sets the request query parameters. */
  set query(payload: any) {
    this.#req.query = payload;
  }
}

/**
 * Builds a JSON object from defined request nodes and
 * available responses as potential sources.
 */
export const buildObject = (nodes: ReqNodes, responses: Responses) => {
  return Object.entries(nodes).reduce((acc, [key, val]) => {
    acc[key] = val[getNodeValue](responses);
    return acc;
  }, {} as any);
};

/** Link a Response node to a Request node */
const link = (dest: ReqNode, source: RespNode) => {
  dest[setSource](source.hash, source.path);
  log(
    `Linked RespNode with hash "${source.hash}" and path "${source.path}" to ReqNode with hash "${dest[nodeHash]}"`,
  );
};
