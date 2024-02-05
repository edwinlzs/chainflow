import debug from 'debug';

export const log = debug('chainflow:http');
export const warn = debug('chainflow:http:error');

log.enabled = true;
warn.enabled = true;
