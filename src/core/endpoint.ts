import { hashEndpoint } from '../utils/hash.js';
import { Responses } from './chainflow.js';
import { ReqNode, ResNode, getNodeValue, setSource } from './nodes.js';
import debug from 'debug';

const log = debug('endpoint');

export type ReqNodes = { [nodeName: string]: ReqNode };

/**
 * Manages request and response nodes,
 * as well as calls to that endpoint
 */
export class Endpoint {
  #route: string;
  #method: string;
  #req: { [key: string]: ReqNode } = {};
  #res: { [key: string]: ResNode } = {};

  constructor({ route, method }: { route: string; method: string }) {
    this.#route = route;
    this.#method = method;
  }

  getHash() {
    return hashEndpoint({ route: this.#route, method: this.#method });
  }

  set req(payload: any) {
    const hash = this.getHash();
    Object.entries(payload).forEach(([key, val]) => {
      log(`Creating ReqNode for hash "${hash}" with key "${key}"`);
      this.#req[key] = new ReqNode({
        val,
        hash,
      });
    });
  }

  set res(payload: any) {
    const hash = this.getHash();
    Object.entries(payload).forEach(([key, val]) => {
      log(`Creating ResNode for hash "${hash}" with path "${key}"`);
      this.#res[key] = new ResNode({
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
    log(`Calling API with hash "${this.getHash()}" and payload ${JSON.stringify(payload)}`);
    // await fetch(this.hash.route, {
    //   method: this.hash.method,
    //   body: JSON.stringify(payload),
    // });
    return payload;
  }

  /** Configure linking of this Req's nodes */
  set(setter: (link: (dest: ReqNode, source: ResNode) => void, nodes: ReqNodes) => void) {
    setter(link, this.#req);
  }

  /** Builds the request payload */
  #buildPayload(responses: Responses) {
    return buildObject(this.#req, responses);
  }
}

/**
 * Builds a JSON object from defined request nodes and
 * available responses as potential sources.
 */
export const buildObject = (
  nodes: {
    [key: string]: ReqNode;
  },
  responses: Responses,
) => {
  return Object.entries(nodes).reduce((acc, [key, val]) => {
    acc[key] = val[getNodeValue](responses);
    return acc;
  }, {} as any);
};

/** Link a Response node to a Request node */
const link = (dest: ReqNode, source: ResNode) => {
  dest[setSource](source.hash, source.path);
  log(
    `Linked ResNode with hash "${source.hash}" and path "${source.path}" to ReqNode with hash "${dest.hash}"`,
  );
};
