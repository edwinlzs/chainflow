import debug from 'debug';
import { Responses } from './chainflow';
import { SourceNode } from './endpoint';
import {
  getNodeValue,
  nodeHash,
  nodePath,
  setSource,
  setSources,
  setValuePool,
  undefinedAllowed,
} from '../utils/symbols';

const log = debug('chainflow:inputNode');

export enum VALUE_POOL_SELECT {
  UNIFORM,
}

export interface INodeWithValue {
  [nodeValueIdentifier]: NodeValue;
}

const nodeValueIdentifier = Symbol('nodeValueIdentifier');
enum NodeValue {
  ValuePool,
  Generator,
  Required,
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

/** Used to mark a param without a default value as required
 * to be sourced from another response. */
export const required = () => ({
  [nodeValueIdentifier]: NodeValue.Required,
});

/** Details of a source node. */
interface ISource {
  /** An array of property accessor strings defining
   * how to access the source node in a response payload
   */
  path: string[];
  /** A callback that will be used on the source value. */
  callback?: (val: any) => any;
  undefinedAllowed?: boolean;
}

/** Multiple source nodes to a request node. */
interface ISources {
  accessInfo: ISourceAccessInfo[];
  callback: (val: any) => any;
}

interface ISourceAccessInfo {
  hash: string;
  path: string[];
  key: string; // the key assigned to this source value when passed into the callback
  undefinedAllowed?: boolean;
}

/** A data node for constructing a request. */
export class InputNode {
  /** Key-values under this node, if this node represents an object. */
  [key: string]: any;
  /** may not be useful. currently only identifying base endpoint. */
  [nodeHash]: string;
  /** Default value of this node */
  #default: any;
  /** Whether this node requires a value from a source response. */
  #required: boolean = false;
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
    if (val == null) {
      this.#default = val;
      return;
    }

    switch (val[nodeValueIdentifier]) {
      case NodeValue.ValuePool:
        this.#valuePool = val.valuePool;
        log(`Defined value pool for InputNode with hash "${hash}`);
        return;
      case NodeValue.Generator:
        log(`Defined value generator for InputNode with hash "${hash}"`);
        this.#generator = val.generator;
        return;
      case NodeValue.Required:
        this.#required = true;
        return;
    }

    switch (typeof val) {
      case 'object':
        if (Array.isArray(val)) {
          this.#default = val;
          break;
        }

        Object.entries(val).forEach(([key, val]) => {
          log(`Creating InputNode for hash "${hash}" with key "${key}"`);
          (this as any)[key] = new InputNode({ val, hash });
        });
        break;
      default:
        this.#default = val;
        break;
    }
  }

  /** Sets a source node for this request node. */
  [setSource](source: SourceNode, callback?: (val: any) => any) {
    this.#sources[source[nodeHash]] = {
      path: source[nodePath],
      undefinedAllowed: source[undefinedAllowed],
      callback,
    };
  }

  /** Sets multiple source nodes to be combined into a single input for this request node */
  [setSources](sources: { [key: string]: SourceNode }, callback: (val: any) => any) {
    const hashes = new Set<string>();
    const accessInfo: ISourceAccessInfo[] = Object.entries(sources).map(([key, source]) => {
      const hash = source[nodeHash];
      hashes.add(hash);
      return {
        path: source[nodePath],
        undefinedAllowed: source[undefinedAllowed],
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
    this.#valuePool = valuePool;
  }

  /** Retrieve value of a node. */
  [getNodeValue](responses: Responses, missingValues: string[][], currentPath: string[]) {
    const usedEndpoints: string[] = []; // stores endpoint responses already tried
    // attempt to get value from any source nodes available
    let endpointHash = this.#matchSourceHash(responses, usedEndpoints);
    while (endpointHash) {
      const respSource = this.#sources[endpointHash]!;

      let respVal;
      if ('accessInfo' in respSource) {
        respVal = this.#getMultiSourceNodeValues(respSource, responses);
      } else {
        respVal = this.#getSingleSourceNodeValue(
          endpointHash,
          respSource.path,
          responses,
          respSource.undefinedAllowed,
        );
      }

      if (
        respVal !== undefined ||
        ('undefinedAllowed' in respSource && respSource.undefinedAllowed)
      ) {
        return respSource.callback ? respSource.callback(respVal) : respVal;
      }

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
      if (this.#required) {
        missingValues.push(currentPath);
        return;
      }
      return this.buildObject(currentPath, missingValues, responses);
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
  #accessSource(
    payload: any,
    path: string[],
    sourceEndpointHash: string,
    undefinedAllowed?: boolean,
  ): any {
    let respVal = payload;

    let i = 0;
    while (i < path.length) {
      // recall that `typeof null` returns 'object'
      if (respVal == null || typeof respVal !== 'object') {
        if (undefinedAllowed) return undefined;
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
  #getSingleSourceNodeValue(
    hash: string,
    path: string[],
    responses: Responses,
    undefinedAllowed?: boolean,
  ) {
    const respPayload = responses[hash]![0];

    log(
      `Retrieving value for InputNode with hash "${this[nodeHash]}" from response of endpoint with hash "${hash}" via path "${path}"`,
    );

    // get response value from a linked source
    return this.#accessSource(respPayload, path, hash, undefinedAllowed);
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
  /**
   * Builds a JSON object from defined request nodes and
   * available responses as potential sources.
   */
  buildObject(currentPath: string[], missingValues: string[][], responses: Responses) {
    return Object.entries(this).reduce((acc, [key, val]) => {
      const nextPath = [...currentPath];
      nextPath.push(key);
      acc[key] = val[getNodeValue](responses, missingValues, nextPath);
      return acc;
    }, {} as any);
  }
}