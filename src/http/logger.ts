/* istanbul ignore file */
import debug from 'debug';
import { enableLogs as enableLogsCore } from '../core/logger';

export const log = debug('chainflow:http');
export const warn = debug('chainflow:http:error');

export const enableLogs = () => {
  log.enabled = true;
  warn.enabled = true;
  enableLogsCore();
};

if (process.env.ENABLE_CHAINFLOW_LOGS === 'true') {
  enableLogs();
}
