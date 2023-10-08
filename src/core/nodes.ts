import debug from "debug";
import { Responses } from "./chainflow";
import { buildObject } from "./endpoint";

const log = debug("nodes");

export const setSource = Symbol("_setSource");
export const getNodeValue = Symbol("_getNodeValue");

/** A data node for constructing a request. */
export class ReqNode {
  [key: string]: any;
  #default: any;
  /** Stores what response node values can be passed into this node and the path to those nodes. */
  #sources: { [nodeHash: string]: string } = {};

  constructor({ val, hash }: { val: any; hash: string }) {
    if (Array.isArray(val)) {
      throw new Error(
        `Unable to handle array types for node with hash "${hash}".`
      );
    }

    if (typeof val === "object") {
      Object.entries(val).forEach(([key, val]) => {
        log(`Creating ReqNode for hash "${hash}" with key "${key}"`);
        (this as any)[key] = new ReqNode({ val, hash });
      });
    } else {
      this.#default = val;
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
          this._hash
        }" from response payload ${JSON.stringify(
          resPayload
        )} via path "${resPath}"`
      );

      // get response value from a linked source
      const resVal = this.#accessSource(resPayload, resPath);

      if (resVal) {
        return resVal;
      }
    }

    if (!this.#default) {
      return buildObject(this as any, responses);
    }

    return this.#default;
  }

  /** Retrieves a matching endpoint hash from this node's sources, if any */
  #getSourceHash(responses: Responses) {
    const sourceEndpointHashes = Object.keys(this.#sources);
    const availEndpointHashes = Object.keys(responses);
    return sourceEndpointHashes.find((hash) =>
      availEndpointHashes.includes(hash)
    );
  }

  /** Access the source node value in a response payload */
  #accessSource(payload: any, path: string): any {
    const accessors = path.split(".");
    let resVal = payload;

    if (!accessors) {
      return null;
    }

    let i = 0;
    while (i < accessors.length && resVal) {
      let accessor = accessors[i]!;
      resVal = resVal[accessor];
      i += 1;
    }

    return resVal;
  }
}

/** A data node for a received response. */
export class ResNode {
  /** Used to uniquely identify the endpoint this ResNode is under. */
  hash: string;
  /** Path to access desired value in a response payload */
  path: string;

  constructor({ val, hash, path }: { val: any; hash: string; path: string }) {
    this.hash = hash;
    if (Array.isArray(val)) {
      throw new Error(
        `Unable to handle array types for node with hash "${hash}".`
      );
    }

    this.path = path;
    if (typeof val === "object") {
      Object.entries(val).forEach(([key, val]) => {
        const nextPath = `${path}.${key}`;
        log(`Creating ResNode for hash "${hash}" with path "${nextPath}"`);
        (this as any)[key] = new ResNode({
          val,
          hash,
          path: nextPath,
        });
      });
    }
  }
}
