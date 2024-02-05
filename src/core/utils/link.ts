import { InputNode } from '../inputNode';
import { setSource, setSources, undefinedAllowed } from './symbols';
import { SourceNode } from '../sourceNode';

/**
 * Link a Source node to a Input node.
 * @param dest the input node that should take a value from a source.
 * @param source the source node that will provide the value for a input.
 * @param callback an optional function that is called on the source source value.
 */
export const link = (dest: InputNode, source: SourceNode, callback?: (val: any) => any) => {
  dest[setSource](source, callback);
};

/**
 * Links multiple Source nodes to a Input node via a callback.
 * @param dest the input node that should take a value from the callback.
 * @param sources an array of source nodes that will be passed into the callback.
 * @param callback a function to merge the sources into a single source for the dest.
 */
export const linkMany = (
  dest: InputNode,
  sources: { [key: string]: SourceNode },
  callback: (val: any) => any,
) => {
  dest[setSources](sources, callback);
};

/**
 * Modifier function that allows a SourceNode to return `undefined` values to an input node.
 * Note that doing so will make it such that this SourceNode will ALWAYS be used to retrieve
 * a value for any linked input node, unless there is another SourceNode with higher priority.
 */
export const allowUndefined = (source: SourceNode) => {
  source[undefinedAllowed] = true;
  return source;
};
