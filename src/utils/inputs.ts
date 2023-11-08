import { debug } from 'debug';
import { ReqNode } from '../core/reqNode';
import { nodeHash, nodePath, setSource, setSources } from './symbols';
import { OutputNode } from '../core/endpoint';

const log = debug('chainflow:inputs');

/**
 * Link a Response node to a Request node.
 * @param dest the request node that should take a value from a response.
 * @param source the response node that will provide the value for a request.
 * @param callback an optional function that is called on the source response value.
 */
export const link = (dest: ReqNode, source: OutputNode, callback?: (val: any) => any) => {
  dest[setSource](source[nodeHash], source[nodePath], callback);
  log(
    `Linked RespNode with hash "${source[nodeHash]}" and path "${source[nodePath].join(
      '.',
    )}" to ReqNode with hash "${dest[nodeHash]}"`,
  );
};

/**
 * Links multiple Response nodes to a Request node via a callback.
 * @param dest the request node that should take a value from the callback.
 * @param sources an array of response nodes that will be passed into the callback.
 * @param callback a function to merge the sources into a single output for the dest.
 */
export const linkMany = (
  dest: ReqNode,
  sources: { [key: string]: OutputNode },
  callback: (val: any) => any,
) => {
  dest[setSources](sources, callback);
  log(`Linked multiple RespNodes object to ReqNode with hash "${dest[nodeHash]}"`);
};
