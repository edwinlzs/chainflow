import { InputNode, NODE_VALUE } from '../inputNode';
import { nodeValueIdentifier, setSource, setSources } from './symbols';
import { SourceNode } from '../sourceNode';

export interface SourceInfo {
  [nodeValueIdentifier]: NODE_VALUE;
  source: SourceNode;
  callback: ((val: any) => any) | undefined;
}

/** Overload signatures for `link` function. */
interface Link {
  /**
   * Link a Source node to an Input node.
   * @param source the source node that will provide the value for an input.
   * @param callback an optional function that is called on the source source value.
   */
  (source: SourceNode, callback?: (val: any) => any): SourceInfo;
  /**
   * Link a Source node to an Input node.
   * @param dest the input node that should take a value from a source.
   * @param source the source node that will provide the value for an input.
   * @param callback an optional function that is called on the source source value.
   */
  (dest: InputNode, source: SourceNode, callback?: (val: any) => any): void;
}

export const link: Link = ((...args: Parameters<Link>) => {
  if (['function', 'undefined'].includes(typeof args[1])) {
    const [source, callback] = args as unknown as [SourceNode, (val: any) => any | undefined];
    return {
      [nodeValueIdentifier]: NODE_VALUE.SOURCE_WITH_CALLBACK,
      source,
      callback,
    };
  } else {
    const [dest, source, callback] = args as [InputNode, SourceNode, (val: any) => any];
    dest[setSource](source, callback);
  }
}) as Link;

export interface MergeSourcesInfo {
  [nodeValueIdentifier]: NODE_VALUE;
  sources: SourceNode[];
  callback: ((val: any) => any) | undefined;
}

/** Overload signatures for `linkMerge` function. */
interface LinkMerge {
  /**
   * Links multiple Source nodes to an Input node via a callback.
   * @param sources an array of source nodes to merge values from.
   * @param callback a function to merge the sources into a single source for the dest.
   */
  (sources: SourceNode[], callback?: (val: any) => any): MergeSourcesInfo;
  /**
   * Links multiple Source nodes to an Input node via a callback.
   * @param sources an object with source nodes to merge values from.
   * @param callback a function to merge the sources into a single source for the dest.
   */
  (sources: { [key: string]: SourceNode }, callback?: (val: any) => any): void;
  /**
   * Links multiple Source nodes to an Input node via a callback.
   * @param dest the input node that should take a value from the callback.
   * @param sources an array of source nodes to merge values from.
   * @param callback a function to merge the sources into a single source for the dest.
   */
  (dest: InputNode, sources: SourceNode[], callback?: (val: any) => any): void;
  /**
   * Links multiple Source nodes to an Input node via a callback.
   * @param dest the input node that should take a value from the callback.
   * @param sources an object with source nodes to merge values from.
   * @param callback a function to merge the sources into a single source for the dest.
   */
  (dest: InputNode, sources: { [key: string]: SourceNode }, callback?: (val: any) => any): void;
}

export const linkMerge: LinkMerge = ((...args: Parameters<LinkMerge>) => {
  if (['function', 'undefined'].includes(typeof args[1])) {
    const [sources, callback] = args as unknown as [
      SourceNode[] | { [key: string]: SourceNode },
      (val: any) => any | undefined,
    ];
    return {
      [nodeValueIdentifier]: NODE_VALUE.MERGE_SOURCES_WITH_CALLBACK,
      sources,
      callback,
    };
  } else {
    const [dest, source, callback] = args as [
      InputNode,
      SourceNode[] | { [key: string]: SourceNode },
      (val: any) => any,
    ];
    dest[setSources](source, callback);
  }
}) as LinkMerge;
