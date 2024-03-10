import { getEndpointId } from './utils/id';
import { InputNode, SourceValues, NODE_VALUE } from '../core/inputNode';
import { ReqBuilder } from './reqBuilder';
import {
  httpClient,
  SUPPORTED_METHOD_UPPERCASE,
  IHttpReq,
  RESP_PARSER,
  ParsedHttpResp,
} from './utils/client';
import { InvalidResponseError, RequiredValuesNotFoundError } from './errors';
import { CallResult, IEndpoint } from '../core/chainflow';
import deepmergeSetup from '@fastify/deepmerge';
import { SourceNode, sourceNode } from '../core/sourceNode';
import { getNodeValue, nodeValueIdentifier } from '../core/utils/symbols';
import { required } from '../core/utils/initializers';
import { IStore, Store } from '../core/store';
import { warn } from './logger';
import { SUPPORTED_METHOD } from './utils/constants';
import { MergeSourcesInfo, SourceInfo } from '../core/utils/link';

const deepmerge = deepmergeSetup();

const PATH_PARAM_REGEX = /\/(\{[^{}]+\})/g;

export interface INodeWithValue {
  [nodeValueIdentifier]: NODE_VALUE;
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
  respParser?: `${RESP_PARSER}`;
  respValidator?: (resp: ParsedHttpResp) => {
    valid: boolean;
    msg?: string;
  };
}

/** Options for configuring an endpoint call. */
export interface HTTPCallOpts {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  pathParams?: Record<string, string>;
  body?: Record<string, any>;
}

/**
 * Manages request and response nodes,
 * as well as calls to that endpoint
 */
export class Endpoint implements IEndpoint<HTTPCallOpts, IHttpReq, ParsedHttpResp> {
  id: string;
  url: string;
  method: SUPPORTED_METHOD;
  #req: ReqBuilder;
  #resp: SourceNode;
  #config: EndpointConfig = {};
  #store: Store = new Store();

  constructor({ url, method }: { url: string; method: SUPPORTED_METHOD }) {
    /** @todo consider validating url */
    !(url.startsWith('http://') || url.startsWith('https://')) && (url = `http://${url}`);
    this.url = url;
    this.method = method as SUPPORTED_METHOD;
    this.id = getEndpointId({ method, url });
    this.#req = new ReqBuilder();
    this.#extractPathParams();
    this.#resp = sourceNode(this.id);
  }

  /** @todo Update this when there is a better implementation of id. */
  get details() {
    return this.id;
  }

  /** Configures this endpoint. */
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

  /** Sets the path params (if they exist in the URL). */
  pathParams(params: Record<string, string | SourceNode | SourceInfo | MergeSourcesInfo>) {
    const pathParamKeys = Object.keys(this.#req.pathParams);
    Object.entries(params).forEach(([key, val]) => {
      if (pathParamKeys.includes(key)) {
        this.#req.pathParams[key] = new InputNode(val);
      }
    });
    return this;
  }

  /** Sets headers provided by the originServer object. */
  baseHeaders(node: InputNode) {
    this.#req.baseHeaders = node;
    return this;
  }

  /** Declare values to store from responses to this endpoint. */
  store(callback: (resp: SourceNode) => IStore<SourceNode>) {
    this.#store.def = callback(this.resp);
    return this;
  }

  /** Calls this endpoint with responses provided from earlier requests in the chain. */
  async call(
    responses: SourceValues,
    opts?: HTTPCallOpts,
  ): Promise<CallResult<IHttpReq, ParsedHttpResp>> {
    const method = this.method.toUpperCase() as SUPPORTED_METHOD_UPPERCASE;

    let body;
    const missingValues: string[][] = []; // contains path of missing required values
    if (method !== 'GET') body = this.#req.body[getNodeValue](responses, missingValues, ['body']);

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
    baseHeaders && (headers = deepmerge(baseHeaders, headers ?? {}));

    const finalMissingValues = this.#findMissingValues(missingValues, opts);
    if (finalMissingValues.length > 0)
      throw new RequiredValuesNotFoundError(this.id, finalMissingValues);

    if (opts?.body) body = deepmerge(body, opts.body);
    if (opts?.pathParams) pathParams = deepmerge(pathParams, opts.pathParams);
    if (opts?.query) queryParams = deepmerge(queryParams, opts.query);
    if (opts?.headers) headers = deepmerge(headers, opts.headers);

    let url = this.url;
    url = this.#insertPathParams(url, pathParams);
    url = this.#insertQueryParams(url, queryParams);

    const resp = await httpClient.request({
      url,
      method: this.method.toUpperCase() as SUPPORTED_METHOD_UPPERCASE,
      body,
      headers,
      respParser: this.#config.respParser,
    });

    const results = this.#config.respValidator?.(resp) ?? this.#validateResp(resp);
    if (!results.valid) throw new InvalidResponseError(results.msg);

    return {
      req: {
        method,
        url,
        body,
        headers,
        respParser: this.#config.respParser,
      },
      resp,
      store: this.#store.storeValues(resp),
    };
  }

  /** Passes the request input nodes of this endpoint to a callback. */
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
    let param;
    const params: Record<string, object> = {};
    while ((param = pathParamRegex.exec(this.url)) !== null && typeof param[1] === 'string') {
      const paramName = param[1].replace('{', '').replace('}', '');
      params[paramName] = required();
    }
    this.#req.pathParams = new InputNode(params);
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
   * i.e. request did not throw error,
   * and status code is not >= 400. */
  #validateResp(resp: ParsedHttpResp): { valid: boolean; msg?: string } {
    if (resp.statusCode >= 400) {
      warn(`Request failed with status code: ${resp.statusCode}`);
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
}
