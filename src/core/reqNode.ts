import debug from 'debug';
import { Responses } from './chainflow';
import { buildObject } from './endpoint';

const log = debug('reqNode');

export const setSource = Symbol('setSource');
export const getNodeValue = Symbol('getNodeValue');
export const nodeHash = Symbol('hash');

/** A data node for constructing a request. */
export class ReqNode {
  /** Key-values under this node, if this node represents an object. */
  [key: string]: any;
  /** may not be useful. currently only identifying base endpoint. */
  [nodeHash]: string;
  /** Default value of this node */
  #default: any;
  /** Stores what response node values can be passed into this node and the path to those nodes. */
  #sources: { [nodeHash: string]: string } = {};

  constructor({ val, hash }: { val: any; hash: string }) {
    this[nodeHash] = hash;
    if (val == null) {
      throw new Error('Unhandled value type: "null".');
    };
    if (Array.isArray(val)) {
      throw new Error('Unhandled value type: "array".');
    };

    switch (typeof val) {
      case 'boolean':
      case 'number':
      case 'string':
        this.#default = val;
        break;
      case 'object':
        Object.entries(val).forEach(([key, val]) => {
          log(`Creating ReqNode for hash "${hash}" with key "${key}"`);
          (this as any)[key] = new ReqNode({ val, hash });
        });
        break;
      default:
        throw new Error(`Unhandled value type: "${typeof val}".`);
    }
  }

  /** Sets a source node for this request node. */
  [setSource](hash: string, path: string) {
    this.#sources[hash] = path;
  }

  /** Retrieve value of a node. */
  [getNodeValue](responses: Responses) {
    const endpointHash = this.#getSourceHash(responses);
    if (endpointHash) {
      const resPath = this.#sources[endpointHash]!;
      const resPayload = responses[endpointHash]![0];

      log(
        `Retrieving value for ReqNode with hash "${
          this[nodeHash]
        }" from response payload ${JSON.stringify(resPayload)} via path "${resPath}"`,
      );

      // get response value from a linked source
      const resVal = this.#accessSource(resPayload, resPath);

      if (resVal) {
        return resVal;
      }
    }

    if (this.#default === undefined) {
      return buildObject(this as any, responses);
    }

    return this.#default;
  }

  /** Retrieves a matching endpoint hash from this node's sources, if any */
  #getSourceHash(responses: Responses) {
    const sourceEndpointHashes = Object.keys(this.#sources);
    const availEndpointHashes = Object.keys(responses);
    return sourceEndpointHashes.find((hash) => availEndpointHashes.includes(hash));
  }

  /** Access the source node value in a response payload */
  #accessSource(payload: any, path: string): any {
    const accessors = path.split('.');
    let resVal = payload;

    let i = 0;
    while (i < accessors.length && resVal) {
      const accessor = accessors[i]!;
      resVal = resVal[accessor];
      i += 1;
    }

    return resVal;
  }
}
