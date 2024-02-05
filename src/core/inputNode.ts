import { SourceNode } from './sourceNode';
import {
  getNodeValue,
  nodeHash,
  nodePath,
  nodeValueIdentifier,
  setSource,
  setSources,
  setValuePool,
  undefinedAllowed,
} from './utils/symbols';

export enum VALUE_POOL_SELECT {
  UNIFORM,
}

export enum NodeValue {
  ValuePool,
  Generator,
  Required,
  Source,
  SourceWithCallback,
  Sources,
}

/** Details of a source node. */
interface ISource {
  /** An array of property accessor strings defining
   * how to access the source node in a source object
   */
  path: string[];
  /** A callback that will be used on the source value. */
  callback?: (val: any) => any;
  undefinedAllowed?: boolean;
}

/** Multiple source nodes to one input node. */
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

type SourceValue = any;

// stores actual values of source objects
export type SourceValues = { [hash: string]: SourceValue[] };

/** A data node for constructing an input object. */
export class InputNode {
  /** Key-values under this node, if this node represents an object. */
  [key: string]: any;
  /** TODO: may not be useful. currently only identifying base object this input node is on. */
  [nodeHash]: string;
  /** Default value of this node */
  #default: any;
  /** Whether this node requires a value from a source object. */
  #required: boolean = false;
  /** Stores what source node values can be passed into this node. */
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
        return;
      case NodeValue.Generator:
        this.#generator = val.generator;
        return;
      case NodeValue.Required:
        this.#required = true;
        return;
      case NodeValue.Source:
        this[setSource](val);
        return;
      case NodeValue.SourceWithCallback: // TODO: explore refactoring here
        this[setSource](val.source, val.callback);
        return;
      case NodeValue.Sources:
        // TODO: validation here
        val.sources.forEach((source: SourceNode) => {
          this[setSource](source, val.callback);
        });
        return;
    }

    switch (typeof val) {
      case 'object':
        if (Array.isArray(val)) {
          // this means you can't put a source node into an array
          this.#default = val;
          break;
        }

        Object.entries(val).forEach(([key, val]) => {
          (this as any)[key] = new InputNode({ val, hash });
        });
        break;
      default:
        this.#default = val;
        break;
    }
  }

  /** Sets a source node for this input node. */
  [setSource](source: SourceNode, callback?: (val: any) => any) {
    this.#sources[source[nodeHash]] = {
      path: source[nodePath],
      undefinedAllowed: source[undefinedAllowed],
      callback,
    };
  }

  /** Sets multiple source nodes to be combined into a single value for this input node */
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

  /** Sets the pool of values for this input node. */
  [setValuePool](valuePool: any[]) {
    this.#valuePool = valuePool;
  }

  /** Retrieve value of a node. */
  [getNodeValue](sourceValues: SourceValues, missingValues: string[][], currentPath: string[]) {
    const usedSources: string[] = []; // stores sourceValues that are already tried
    // attempt to get value from any source nodes available
    let sourceHash = this.#matchSourceHash(sourceValues, usedSources);
    while (sourceHash) {
      const source = this.#sources[sourceHash]!;

      let sourceVal;
      if ('accessInfo' in source) {
        sourceVal = this.#getMultiSourceNodeValues(source, sourceValues);
      } else {
        sourceVal = this.#getSingleSourceNodeValue(
          sourceHash,
          source.path,
          sourceValues,
          source.undefinedAllowed,
        );
      }

      if (sourceVal !== undefined || ('undefinedAllowed' in source && source.undefinedAllowed)) {
        return source.callback ? source.callback(sourceVal) : sourceVal;
      }

      usedSources.push(...sourceHash.split('|'));
      sourceHash = this.#matchSourceHash(sourceValues, usedSources);
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
      return this.buildObject(currentPath, missingValues, sourceValues);
    }

    // if other options are exhausted, revert to default
    return this.#default;
  }

  /** Retrieves a matching source hash from this node's sources, if any,
   *  excluding sources that are already used for the current input. */
  #matchSourceHash(sourceValues: SourceValues, usedSources: string[]) {
    const sourceHashes = Object.keys(this.#sources);
    const availSourceHashes = Object.keys(sourceValues);
    return sourceHashes.find((hash) => {
      if (hash.includes('|')) {
        // handle combined hash for multi-node source
        const hashes = hash.split('|');
        if (
          // if every source is available
          hashes.every((hash) => availSourceHashes.includes(hash) && !usedSources.includes(hash))
        ) {
          return hash;
        }
      }
      return availSourceHashes.includes(hash) && !usedSources.includes(hash);
    });
  }

  /** Access the source node value in a source object */
  #accessSource(payload: any, path: string[], sourceHash: string, undefinedAllowed?: boolean): any {
    let sourceVal = payload;

    let i = 0;
    while (i < path.length) {
      // recall that `typeof null` returns 'object'
      if (sourceVal == null || typeof sourceVal !== 'object') {
        if (undefinedAllowed) return undefined;
        return;
      }
      const accessor = path[i]!;
      sourceVal = sourceVal[accessor];
      i += 1;
    }

    return sourceVal;
  }

  /** Attempts to retrieve values for an input node from a single source node. */
  #getSingleSourceNodeValue(
    hash: string,
    path: string[],
    sourceValues: SourceValues,
    undefinedAllowed?: boolean,
  ) {
    const sourceObject = sourceValues[hash]![0];

    // get value from a linked source
    return this.#accessSource(sourceObject, path, hash, undefinedAllowed);
  }

  /** Attempts to retrieve values for an input node from multiple source nodes. */
  #getMultiSourceNodeValues(sources: ISources, sourceValues: SourceValues) {
    const sourceVals: { [key: string]: any } = {};
    for (const info of sources.accessInfo) {
      const sourceVal = this.#getSingleSourceNodeValue(info.hash, info.path, sourceValues);
      // if one value is unavailable, stop constructing multi-source value
      if (sourceVal === undefined) return undefined;
      sourceVals[info.key] = sourceVal;
    }
    return sourceVals;
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
   * Builds a JSON object from input node values and
   * any available linked sources.
   */
  buildObject(currentPath: string[], missingValues: string[][], sourceValues: SourceValues) {
    return Object.entries(this).reduce((acc, [key, val]) => {
      const nextPath = [...currentPath];
      nextPath.push(key);
      acc[key] = val[getNodeValue](sourceValues, missingValues, nextPath);
      return acc;
    }, {} as any);
  }
}
