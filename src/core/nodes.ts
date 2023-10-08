import debug from "debug";
import { Responses } from "./chainflow";
import { buildObject } from "./endpoint";

const log = debug("nodes");

class DataNode {
  _hash: string;

  constructor({ hash }: { hash: string }) {
    this._hash = hash;
  }
}

/** A data node for constructing a request. */
export class ReqNode extends DataNode {
  _default: any;
  /** Stores what response node values can be passed into this node and the path to those nodes. */
  _sources: { [nodeHash: string]: string } = {};
  _object: { [key: string]: ReqNode } | undefined;

  constructor({ val, hash }: { val: any; hash: string }) {
    super({ hash });
    if (Array.isArray(val)) {
      throw new Error(
        `Unable to handle array types for node with hash "${hash}".`
      );
    }

    if (typeof val === "object") {
      this._object = {};
      Object.entries(val).forEach(([key, val]) => {
        log(`Creating ReqNode for hash "${hash}" with key "${key}"`);
        this._object![key] = new ReqNode({ val, hash });
      });
    } else {
      this._default = val;
    }
  }

  /** Retrieve value of a node. */
  getNodeValue(responses: Responses) {
    const endpointHash = this.#getSourceHash(responses);
    if (endpointHash) {
      const resPath = this._sources[endpointHash]!;
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

    if (this._object) {
      return buildObject(this._object, responses);
    }

    return this._default;
  }

  /** Retrieves a matching endpoint hash from this node's sources, if any */
  #getSourceHash(responses: Responses) {
    const sourceEndpointHashes = Object.keys(this._sources);
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
export class ResNode extends DataNode {
  /** Path to access desired value in a response payload */
  _path: string;

  constructor({ val, hash, path }: { val: any; hash: string; path: string }) {
    super({ hash });
    if (Array.isArray(val)) {
      throw new Error(
        `Unable to handle array types for node with hash "${hash}".`
      );
    }

    this._path = path;
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
