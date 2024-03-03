/* istanbul ignore file */
import debug from 'debug';
import { enableLogs as enableLogs_core } from '../core/logger';

export const log = debug('chainflow:http');
export const warn = debug('chainflow:http:error');

export const enableLogs = () => {
  log.enabled = true;
  warn.enabled = true;
  enableLogs_core();
};

if (process.env.ENABLE_CHAINFLOW_LOGS === 'true') {
  enableLogs();
}
