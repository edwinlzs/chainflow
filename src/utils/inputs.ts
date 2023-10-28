import { debug } from 'debug';
import { ReqNode } from '../core/reqNode';
import { nodeHash, nodePath, setSource } from './symbols';

const log = debug('chainflow:inputs');

/** Link a Response node to a Request node. */
export const link: (dest: ReqNode, source: any) => void = (dest: ReqNode, source: any) => {
  dest[setSource](source[nodeHash], source[nodePath]);
  log(
    `Linked RespNode with hash "${source[nodeHash]}" and path "${source[nodePath].join(
      '.',
    )}" to ReqNode with hash "${dest[nodeHash]}"`,
  );
};
