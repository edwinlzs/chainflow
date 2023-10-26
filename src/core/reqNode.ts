import debug from 'debug';
import { Responses } from './chainflow';
import { buildObject } from './endpoint';

const log = debug('chainflow:reqNode');

export const setSource = Symbol('setSource');
export const setValuePool = Symbol('setValuePool');
export const getNodeValue = Symbol('getNodeValue');
export const nodeHash = Symbol('hash');

export enum VALUE_POOL_SELECT {
  UNIFORM,
}

const nodeValueIdentifier = Symbol('nodeValueIdentifier');
enum NodeValue {
  ValuePool,
  Generator,
}

/** Defines a set of values to choose from when making an endpoint call. */
export const valPool = (valuePool: any[]) => ({
  valuePool,
  [nodeValueIdentifier]: NodeValue.ValuePool,
});

/** Provides a generator function to produce a value for an endpoint call. */
export const valGen = (generator: () => any) => ({
  generator,
  [nodeValueIdentifier]: NodeValue.Generator,
});

/** A data node for constructing a request. */
export class ReqNode {
  /** Key-values under this node, if this node represents an object. */
  [key: string]: any;
  /** may not be useful. currently only identifying base endpoint. */
  [nodeHash]: string;
  /** Default value of this node */
  #default: any;
  /** Stores what response node values can be passed into this node
   *  and the path (as an array of property accessor strings) to those nodes. */
  #sources: { [nodeHash: string]: string[] } = {};
  /** Stores possible values this node can take. */
  #valuePool: any[] = [];
  /** Determines what strategy to select from pool of values */
  #valuePoolSelect: VALUE_POOL_SELECT = VALUE_POOL_SELECT.UNIFORM;
  /** Generator function to generate values on demand for this node. */
  #generator: (() => any) | undefined;

  constructor({ val, hash }: { val: any; hash: string }) {
    this[nodeHash] = hash;
    if (val == null) {
      throw new Error('Unhandled value type: "null"');
    }

    switch (val[nodeValueIdentifier]) {
      case NodeValue.ValuePool:
        this.#valuePool = val.valuePool;
        log(`Defined value pool for ReqNode with hash "${hash}`);
        return;
      case NodeValue.Generator:
        log(`Defined value generator for ReqNode with hash "${hash}"`);
        this.#generator = val.generator;
        return;
    }

    if (Array.isArray(val)) {
      throw new Error('Unhandled value type: "array"');
    }

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
        throw new Error(`Unhandled value type: "${typeof val}"`);
    }
  }

  /** Sets a source node for this request node. */
  [setSource](hash: string, path: string[]) {
    this.#sources[hash] = path;
  }

  /** Sets the pool of values for this request node. */
  [setValuePool](valuePool: any[]) {
    // TODO: some sort of type validation for provided value pool?
    this.#valuePool = valuePool;
  }

  /** Retrieve value of a node. */
  [getNodeValue](responses: Responses) {
    // attempt to get value from any source nodes available
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

      if (resVal) return resVal;
    }

    // attempt to get value from generator function
    if (this.#generator) {
      return this.#generator();
    }

    // attempt to get value from value pool
    if (this.#valuePool.length > 0) {
      return this.#selectValue();
    }

    // default will only be undefined for objects that need to be built further
    if (this.#default === undefined) {
      return buildObject(this as any, responses);
    }

    // if other options are exhausted, revert to default
    return this.#default;
  }

  /** Retrieves a matching endpoint hash from this node's sources, if any */
  #getSourceHash(responses: Responses) {
    const sourceEndpointHashes = Object.keys(this.#sources);
    const availEndpointHashes = Object.keys(responses);
    return sourceEndpointHashes.find((hash) => availEndpointHashes.includes(hash));
  }

  /** Access the source node value in a response payload */
  #accessSource(payload: any, path: string[]): any {
    let resVal = payload;

    let i = 0;
    while (i < path.length && resVal) {
      const accessor = path[i]!;
      resVal = resVal[accessor];
      i += 1;
    }

    return resVal;
  }

  /** Selects a value from the value pool based on the value pool select strategy. */
  #selectValue(): any {
    if (this.#valuePool.length === 0) return;
    switch (this.#valuePoolSelect) {
      case VALUE_POOL_SELECT.UNIFORM:
      default:
        return this.#valuePool[Math.floor(Math.random() * this.#valuePool.length)];
    }
  }
}
