import { SourceNode } from './sourceNode';
import {
  getNodeValue,
  sourceId,
  nodePath,
  nodeValueIdentifier,
  setSource,
  setSources,
  allowUndefined,
} from './utils/symbols';

export enum NODE_VALUE {
  GENERATOR,
  REQUIRED,
  SOURCE,
  SOURCE_WITH_CALLBACK,
  MERGE_SOURCES_WITH_CALLBACK,
}

/** Details of a source node. */
interface ISource {
  /** An array of property accessor strings defining
   * how to access the source node in a source object
   */
  path: string[];
  /** A callback that will be used on the source value. */
  callback?: (val: any) => any;
  allowUndefined?: boolean;
}

/** Merge multiple source nodes to one input node. */
interface ISources {
  accessInfo: ISourceAccessInfo[];
  isArray: boolean;
  callback?: (val: any) => any;
}

interface ISourceAccessInfo {
  id: string;
  path: string[];
  // the name this source value will be assigned to
  key?: string;
  allowUndefined?: boolean;
}

type SourceValue = any;

// stores actual values of source objects
export type SourceValues = { [id: string]: SourceValue[] };

/** A data node for constructing an input object. */
export class InputNode {
  /** Key-values under this node, if this node represents an object. */
  [key: string]: any;
  /** Determines if this is a key-value object that needs to be built further. */
  #isKvObject: boolean = false;
  /** Default value of this node */
  #default: any;
  /** Whether this node requires a value from a source object. */
  #required: boolean = false;
  /** Stores what source node values can be passed into this node. */
  #sources: { [sourceId: string]: ISource | ISources } = {};
  /** Generator function to generate values on demand for this node. */
  #generator: (() => any) | undefined;

  constructor(val: any) {
    if (val == null) {
      this.#default = val;
      return;
    }

    switch (val[nodeValueIdentifier]) {
      case NODE_VALUE.GENERATOR:
        this.#generator = val.generator;
        return;
      case NODE_VALUE.REQUIRED:
        this.#required = true;
        return;
      case NODE_VALUE.SOURCE:
        this[setSource](val);
        return;
      case NODE_VALUE.SOURCE_WITH_CALLBACK /** @todo explore refactoring here */:
        this[setSource](val.source, val.callback);
        return;
      case NODE_VALUE.MERGE_SOURCES_WITH_CALLBACK:
        this[setSources](val.sources, val.callback);
        return;
    }

    switch (typeof val) {
      case 'object':
        if (Array.isArray(val)) {
          // this means you can't put a source node into an array
          this.#default = val;
          break;
        }

        this.#isKvObject = true;
        Object.entries(val).forEach(([key, val]) => {
          (this as any)[key] = new InputNode(val);
        });
        break;
      default:
        this.#default = val;
        break;
    }
  }

  /** Sets a source node for this input node. */
  [setSource](source: SourceNode, callback?: (val: any) => any) {
    this.#sources[source[sourceId]] = {
      path: source[nodePath],
      allowUndefined: source[allowUndefined],
      callback,
    };
  }

  /** Sets multiple source nodes to be merged into a single value for this input node */
  [setSources](
    sources: SourceNode[] | { [key: string]: SourceNode },
    callback?: (val: any) => any,
  ) {
    const ids = new Set<string>();

    let accessInfo: ISourceAccessInfo[];
    let isArray = false;
    if (Array.isArray(sources)) {
      isArray = true;
      accessInfo = sources.map((source) => {
        const id = source[sourceId];
        ids.add(id);
        return {
          path: source[nodePath],
          allowUndefined: source[allowUndefined],
          id,
        };
      });
    } else {
      accessInfo = Object.entries(sources).map(([key, source]) => {
        const id = source[sourceId];
        ids.add(id);
        return {
          path: source[nodePath],
          allowUndefined: source[allowUndefined],
          id,
          key,
        };
      });
    }

    /** @todo improve this */
    this.#sources[new Array(...ids).sort().join('|')] = {
      accessInfo,
      isArray,
      callback,
    };
  }

  /** Retrieve value of a node. */
  [getNodeValue](sourceValues: SourceValues, missingValues: string[][], currentPath: string[]) {
    const usedSources: string[] = []; // stores sourceValues that are already tried
    // attempt to get value from any source nodes available
    let sourceEndpointId = this.#matchSourceId(sourceValues, usedSources);
    while (sourceEndpointId) {
      const source = this.#sources[sourceEndpointId]!;

      let sourceVal;
      if ('accessInfo' in source) {
        sourceVal = this.#getMergeSourceNodeValues(source, sourceValues);
      } else {
        sourceVal = this.#getSingleSourceNodeValue(sourceEndpointId, source.path, sourceValues);
      }

      if (sourceVal !== undefined || ('allowUndefined' in source && source.allowUndefined)) {
        return source.callback ? source.callback(sourceVal) : sourceVal;
      }

      usedSources.push(...sourceEndpointId.split('|'));
      sourceEndpointId = this.#matchSourceId(sourceValues, usedSources);
    }

    // attempt to get value from generator function
    if (this.#generator) {
      return this.#generator();
    }

    if (this.#isKvObject) {
      return this.buildKvObject(currentPath, missingValues, sourceValues);
    }

    // default will only be undefined for objects that need to be built further
    if (this.#default === undefined && this.#required) {
      missingValues.push(currentPath);
      return;
    }

    // if other options are exhausted, revert to default
    return this.#default;
  }

  /** Retrieves a matching source id from this node's sources, if any,
   *  excluding sources that are already used for the current input. */
  #matchSourceId(sourceValues: SourceValues, usedSources: string[]) {
    const sourceEndpointIds = Object.keys(this.#sources);
    const availSourceIds = Object.keys(sourceValues);
    return sourceEndpointIds.find((id) => {
      if (id.includes('|')) {
        // handle combined id for multi-node source
        const ids = id.split('|');
        if (
          // if every source is available
          ids.every((id) => availSourceIds.includes(id) && !usedSources.includes(id))
        ) {
          return id;
        }
      }
      return availSourceIds.includes(id) && !usedSources.includes(id);
    });
  }

  /** Access the source node value in a source object */
  #accessSource(payload: any, path: string[]): any {
    let sourceVal = payload;

    let i = 0;
    while (i < path.length) {
      // still in the process of walking the path to the actual
      // source value, hence current sourceVal should be an object
      // However, `typeof null` returns 'object'
      // hence the 2nd condition checks against `null`
      if (typeof sourceVal !== 'object' || sourceVal == null) return;
      const accessor = path[i]!;
      sourceVal = sourceVal[accessor];
      i += 1;
    }

    return sourceVal;
  }

  /** Attempts to retrieve values for an input node from a single source node. */
  #getSingleSourceNodeValue(id: string, path: string[], sourceValues: SourceValues) {
    const sourceObject = sourceValues[id]![0];

    // get value from a linked source
    return this.#accessSource(sourceObject, path);
  }

  /**
   * Attempts to retrieve values for an input node from multiple source nodes to be merged. */
  #getMergeSourceNodeValues(sources: ISources, sourceValues: SourceValues) {
    let sourceVals: { [key: string]: unknown } | unknown[];
    sources.isArray ? (sourceVals = []) : (sourceVals = {});

    for (const info of sources.accessInfo) {
      const sourceVal = this.#getSingleSourceNodeValue(info.id, info.path, sourceValues);
      // if one value is unavailable, stop constructing multi-source value
      if (sourceVal === undefined) return undefined;
      sources.isArray
        ? (sourceVals as unknown[]).push(sourceVal)
        : ((sourceVals as { [key: string]: unknown })[info.key!] = sourceVal);
    }

    return sourceVals;
  }

  /**
   * Builds a key-value object from input node values and
   * any available linked sources.
   */
  buildKvObject(currentPath: string[], missingValues: string[][], sourceValues: SourceValues) {
    return Object.entries(this).reduce((acc, [key, val]) => {
      const nextPath = [...currentPath, key];
      acc[key] = val[getNodeValue](sourceValues, missingValues, nextPath);
      return acc;
    }, {} as any);
  }
}
