import { InputNode, NodeValue } from '../inputNode';
import { nodeValueIdentifier, setSource, setSources, undefinedAllowed } from './symbols';
import { SourceNode } from '../sourceNode';

interface SourceInfo {
  [nodeValueIdentifier]: NodeValue;
  source: SourceNode;
  callback: ((val: any) => any) | undefined;
}

/** Overload signature for `linkMerge` function. */
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
      [nodeValueIdentifier]: NodeValue.SourceWithCallback,
      source,
      callback,
    };
  } else {
    const [dest, source, callback] = args as [InputNode, SourceNode, (val: any) => any];
    dest[setSource](source, callback);
  }
}) as Link;

interface MergeSourcesInfo {
  [nodeValueIdentifier]: NodeValue;
  sources: SourceNode[];
  callback: ((val: any) => any) | undefined;
}

/** Overload signature for `linkMerge` function. */
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
      [nodeValueIdentifier]: NodeValue.MergeSourcesWithCallback,
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

/**
 * Modifier function that allows a SourceNode to return `undefined` values to an input node.
 * Note that doing so will make it such that this SourceNode will ALWAYS be used to retrieve
 * a value for any linked input node, unless there is another SourceNode with higher priority.
 */
export const allowUndefined = (source: SourceNode) => {
  source[undefinedAllowed] = true;
  return source;
};
