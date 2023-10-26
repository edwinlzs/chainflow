import { debug } from 'debug';
import { ReqNode, nodeHash, setSource } from '../core/reqNode';
import { nodePath } from '../core/endpoint';

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
