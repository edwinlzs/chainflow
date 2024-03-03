/* istanbul ignore file */
import debug from 'debug';

export const log = debug('chainflow:core');
export const warn = debug('chainflow:core:error');

export const enable_logs = () => {
  log.enabled = true;
  warn.enabled = true;
};

if (process.env.ENABLE_CHAINFLOW_LOGS === 'true') {
  enable_logs();
}
