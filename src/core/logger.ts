/* istanbul ignore file */
import debug from 'debug';

export const log = debug('chainflow:core');
export const warn = debug('chainflow:core:error');

if (process.env.ENABLE_CHAINFLOW_LOGS === 'true') {
  log.enabled = true;
  warn.enabled = true;
}
