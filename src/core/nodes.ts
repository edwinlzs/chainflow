import debug from "debug";

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
  _type: string;
  /** Stores what response node values can be passed into this node. */
  _sources: { [nodeHash: string]: string } = {};

  constructor({ val, hash }: { val: any; hash: string }) {
    super({ hash });
    this._default = val;
    switch (typeof val) {
      case "string":
        this._type = "string";
        break;
      case "object":
        this._type = "object";
        Object.entries(val).forEach(([key, val]) => {
          log(`Creating ReqNode for hash "${hash}" with key "${key}"`);
          (this as any)[key] = new ReqNode({ val, hash });
        });
        break;
      default:
        this._type = "string";
    }
  }
}

/** A data node for a received response. */
export class ResNode extends DataNode {
  /** Path to access desired value in a response payload */
  _path: string;
  _type: string;

  constructor({ val, hash, path }: { val: any; hash: string; path: string }) {
    super({ hash });
    this._path = path;
    switch (typeof val) {
      case "string":
        this._type = "string";
        break;
      case "object":
        this._type = "object";
        Object.entries(val).forEach(([key, val]) => {
          const nextPath = `${path}.${key}`;
          log(`Creating ResNode for hash "${hash}" with path "${nextPath}"`);
          (this as any)[key] = new ResNode({
            val,
            hash,
            path: nextPath,
          });
        });
        break;
      default:
        this._type = "string";
    }
  }
}