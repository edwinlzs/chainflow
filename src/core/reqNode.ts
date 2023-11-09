import debug from 'debug';
import { Responses } from './chainflow';
import { OutputNode, buildObject } from './endpoint';
import {
  getNodeValue,
  nodeHash,
  nodePath,
  setSource,
  setSources,
  setValuePool,
} from '../utils/symbols';

const log = debug('chainflow:reqNode');

export enum VALUE_POOL_SELECT {
  UNIFORM,
}

const nodeValueIdentifier = Symbol('nodeValueIdentifier');
enum NodeValue {
  ValuePool,
  Generator,
}

/** Defines a set of values to choose from when making an endpoint call. */
export const pool = (valuePool: any[]) => ({
  valuePool,
  [nodeValueIdentifier]: NodeValue.ValuePool,
});

/** Provides a generator function to produce a value for an endpoint call. */
export const gen = (generator: () => any) => ({
  generator,
  [nodeValueIdentifier]: NodeValue.Generator,
});

/** Details of a source node. */
interface ISource {
  /** An array of property accessor strings defining
   * how to access the source node in a response payload
   */
  path: string[];
  /** A callback that will be used on the source value. */
  callback?: (val: any) => any;
}

/** Multiple source nodes to a request node. */
interface ISources {
  accessInfo: ISourceAccessInfo[];
  callback: (val: any) => any;
}

interface ISourceAccessInfo {
  hash: string;
  path: string[];
  key: string; // the key given to this value when passing into the callback
}

/** A data node for constructing a request. */
export class ReqNode {
  /** Key-values under this node, if this node represents an object. */
  [key: string]: any;
  /** may not be useful. currently only identifying base endpoint. */
  [nodeHash]: string;
  /** Default value of this node */
  #default: any;
  /** Stores what response node values can be passed into this node. */
  #sources: { [nodeHash: string]: ISource | ISources } = {};
  /** Stores possible values this node can take. */
  #valuePool: any[] = [];
  /** Determines what strategy to select from pool of values */
  #valuePoolSelect: VALUE_POOL_SELECT = VALUE_POOL_SELECT.UNIFORM;
  /** Generator function to generate values on demand for this node. */
  #generator: (() => any) | undefined;

  constructor({ val, hash }: { val: any; hash: string }) {
    this[nodeHash] = hash;

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

    switch (typeof val) {
      case 'object':
        if (Array.isArray(val)) {
          this.#default = val;
          break;
        }

        Object.entries(val).forEach(([key, val]) => {
          log(`Creating ReqNode for hash "${hash}" with key "${key}"`);
          (this as any)[key] = new ReqNode({ val, hash });
        });
        break;
      default:
        this.#default = val;
        break;
    }
  }

  /** Sets a source node for this request node. */
  [setSource](hash: string, path: string[], callback?: (val: any) => any) {
    this.#sources[hash] = {
      path,
      callback,
    };
  }

  /** Sets multiple source nodes to be combined into a single input for this request node */
  [setSources](sources: { [key: string]: OutputNode }, callback: (val: any) => any) {
    const hashes = new Set<string>();
    const accessInfo: ISourceAccessInfo[] = Object.entries(sources).map(([key, source]) => {
      const hash = source[nodeHash];
      hashes.add(hash);
      return {
        path: source[nodePath],
        hash,
        key,
      };
    });
    this.#sources[new Array(...hashes).sort().join('|')] = {
      accessInfo,
      callback,
    };
  }

  /** Sets the pool of values for this request node. */
  [setValuePool](valuePool: any[]) {
    // TODO: some sort of type validation for provided value pool?
    this.#valuePool = valuePool;
  }

  /** Retrieve value of a node. */
  [getNodeValue](responses: Responses) {
    const usedEndpoints: string[] = []; // stores endpoint responses already tried
    // attempt to get value from any source nodes available
    // TODO: refactor to match & access source at the same time rather than doing separately
    let endpointHash = this.#matchSourceHash(responses, usedEndpoints);
    while (endpointHash) {
      const respSource = this.#sources[endpointHash]!;

      let respVal;
      if ('accessInfo' in respSource) {
        respVal = this.#getMultiSourceNodeValues(respSource, responses);
      } else {
        respVal = this.#getSingleSourceNodeValue(endpointHash, respSource.path, responses);
      }

      if (respVal !== undefined)
        return respSource.callback ? respSource.callback(respVal) : respVal;

      usedEndpoints.push(...endpointHash.split('|'));
      endpointHash = this.#matchSourceHash(responses, usedEndpoints);
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

  /** Retrieves a matching endpoint hash from this node's sources, if any,
   *  excluding endpoints that are already used for the current endpoint call. */
  #matchSourceHash(responses: Responses, usedEndpoints: string[]) {
    const sourceEndpointHashes = Object.keys(this.#sources);
    const availEndpointHashes = Object.keys(responses);
    return sourceEndpointHashes.find((hash) => {
      if (hash.includes('|')) {
        // handle combined hash for multi-node source
        const hashes = hash.split('|');
        if (
          // if every response is available
          hashes.every(
            (hash) => availEndpointHashes.includes(hash) && !usedEndpoints.includes(hash),
          )
        ) {
          return hash;
        }
      }
      return availEndpointHashes.includes(hash) && !usedEndpoints.includes(hash);
    });
  }

  /** Access the source node value in a response payload */
  #accessSource(payload: any, path: string[], sourceEndpointHash: string): any {
    let respVal = payload;

    let i = 0;
    while (i < path.length) {
      if (respVal == null || typeof respVal !== 'object') {
        log(
          `Unable to retrieve source node value from response to endpoint with hash "${sourceEndpointHash}".`,
        );
        return;
      }
      const accessor = path[i]!;
      respVal = respVal[accessor];
      i += 1;
    }

    return respVal;
  }

  /** Attempts to retrieve values for a request node from a single source node. */
  #getSingleSourceNodeValue(hash: string, path: string[], responses: Responses) {
    const respPayload = responses[hash]![0];

    log(
      `Retrieving value for ReqNode with hash "${this[nodeHash]}" from response of endpoint with hash ${hash} via path "${path}"`,
    );

    // get response value from a linked source
    return this.#accessSource(respPayload, path, hash);
  }

  /** Attempts to retrieve values for a request node from multiple source nodes. */
  #getMultiSourceNodeValues(sources: ISources, responses: Responses) {
    const respVals: { [key: string]: any } = {};
    for (const info of sources.accessInfo) {
      const respVal = this.#getSingleSourceNodeValue(info.hash, info.path, responses);
      // if one value is unavailable, stop constructing multi-source value
      if (respVal === undefined) return undefined;
      respVals[info.key] = respVal;
    }
    log(`All source values retrieved for multi-source node with hash "${this[nodeHash]}"`);
    return respVals;
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
