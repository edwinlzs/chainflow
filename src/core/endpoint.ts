import { hashEndpoint } from '../utils/hash.js';
import { SUPPORTED_METHOD, SUPPORTED_METHODS, Responses } from './chainflow.js';
import { ReqNode, getNodeValue, nodeHash, setSource } from './reqNode.js';
import debug from 'debug';
import { ReqBuilder, ReqNodes } from './reqBuilder.js';
import { RespNode } from './respNode.js';
import http, { SUPPORTED_METHOD_UPPERCASE } from '../utils/http.js';

const log = debug('endpoint');

type RespNodes = { [key: string]: RespNode };

/**
 * Manages request and response nodes,
 * as well as calls to that endpoint
 */
export class Endpoint {
  #host: string = '127.0.0.1';
  #path: string;
  #method: SUPPORTED_METHOD;
  #req: ReqBuilder = new ReqBuilder({ hash: this.getHash() });
  #res: RespNodes = {};
  /** Temporarily substitutes a real response from calling an API. */
  #tempRes: any;

  constructor({ path, method }: { path: string; method: string }) {
    method = method.toLowerCase();
    if (!SUPPORTED_METHODS.includes(method as SUPPORTED_METHOD))
      throw new Error(`Unsupported method: "${method}"`);
    this.#path = path;
    this.#method = method as SUPPORTED_METHOD;
  }

  set host(host: string) {
    this.#host = host;
  }

  get method() {
    return this.#method;
  }

  /** Returns a hash that uniquely identifies this endpoint. */
  getHash() {
    return hashEndpoint({ route: this.#path, method: this.#method });
  }

  set req(payload: any) {
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

  /** Calls this endpoint with provided responses */
  async call(responses: any): Promise<any> {
    const payload = this.#buildPayload(responses);
    await http.httpReq({
      route: `${this.#host}${this.#path}`,
      method: this.#method.toUpperCase() as SUPPORTED_METHOD_UPPERCASE,
      body: payload,
    });

    return this.#tempRes;
  }

  /** Configure linking of this Req's nodes */
  set(setter: (link: (dest: ReqNode, source: RespNode) => void, nodes: ReqNodes) => void) {
    setter(link, this.#req.body);
  }

  /** Builds the request payload */
  #buildPayload(responses: Responses) {
    return buildObject(this.#req.body, responses);
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
