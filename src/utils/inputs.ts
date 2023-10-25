import { debug } from 'debug';
import { ReqNode, nodeHash, setSource } from '../core/reqNode';
import { RespNode } from '../core/respNode';

const log = debug('chainflow:inputs');

/** Link a Response node to a Request node. */
export const link: (dest: ReqNode, source: RespNode) => void = (
  dest: ReqNode,
  source: RespNode,
) => {
  dest[setSource](source.hash, source.path);
  log(
    `Linked RespNode with hash "${source.hash}" and path "${source.path}" to ReqNode with hash "${dest[nodeHash]}"`,
  );
};
