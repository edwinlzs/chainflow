import { SourceNode } from '../sourceNode';
import { allowUndefined } from './symbols';

/** Options to configure a Source Node. */
interface SourceConfigOpts {
  /**
   * Note that setting this to true will make it such that
   * this SourceNode will ALWAYS be used to retrieve
   * a value for any linked input node,
   * unless there is another SourceNode with higher priority.
   */
  allowUndefined?: boolean;
}

/**
 * Modifies a SourceNode with several options.
 */
export const config = (source: SourceNode, opts: SourceConfigOpts) => {
  opts.allowUndefined && (source[allowUndefined] = true);
  return source;
};
