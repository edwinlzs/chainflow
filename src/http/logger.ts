/* istanbul ignore file */
import debug from 'debug';

export const log = debug('chainflow:http');
export const warn = debug('chainflow:http:error');

if (process.env.ENABLE_CHAINFLOW_LOGS === 'true') {
  log.enabled = true;
  warn.enabled = true;
}
