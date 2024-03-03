/* istanbul ignore file */
import debug from 'debug';
import { enable_logs as enable_logs_core } from '../core/logger';

export const log = debug('chainflow:http');
export const warn = debug('chainflow:http:error');

export const enable_logs = () => {
  log.enabled = true;
  warn.enabled = true;
  enable_logs_core();
};

if (process.env.ENABLE_CHAINFLOW_LOGS === 'true') {
  enable_logs();
}
