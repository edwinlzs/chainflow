import { debug } from 'debug';
import { ReqNode } from '../core/reqNode';
import { nodeHash, nodePath, setSource } from './symbols';

const log = debug('chainflow:inputs');

/**
 * Link a Response node to a Request node.
 * @param dest the request node that should take a value from a response.
 * @param source the response node that will provide the value for a request.
 * @param callback an optional function that is called on the source response value.
 */
export const link = (dest: ReqNode, source: any, callback?: (val: any) => any): void => {
  dest[setSource](source[nodeHash], source[nodePath], callback);
  log(
    `Linked RespNode with hash "${source[nodeHash]}" and path "${source[nodePath].join(
      '.',
    )}" to ReqNode with hash "${dest[nodeHash]}"`,
  );
};
