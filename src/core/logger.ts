import debug from 'debug';

export const log = debug('chainflow:core');
export const warn = debug('chainflow:core:error');

log.enabled = true;
warn.enabled = true;