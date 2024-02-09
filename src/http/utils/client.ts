import { request as undiciRequest } from 'undici';
import { log, warn } from '../logger';

export type SUPPORTED_METHOD_UPPERCASE = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export const defaultHeaders = {
  connection: 'keep-alive',
  accept: '*/*',
  'content-type': 'application/json',
  // 'User-Agent': 'Chainflow/0.1',
};

/** Sends a HTTP request. */
const request = async ({
  addr,
  path,
  method,
  body,
  headers,
}: {
  addr: string;
  path: string;
  method: SUPPORTED_METHOD_UPPERCASE;
  body?: any;
  headers?: Record<string, string>;
}) => {
  const finalHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  log(
    `[${method}] [${addr}${path}] with headers %O${body ? ' and payload %O' : ''}`,
    finalHeaders,
    body,
  );

  try {
    const resp = await undiciRequest(`${addr}${path}`, {
      method,
      body: JSON.stringify(body),
      headers: finalHeaders,
    });

    return resp;
  } catch (err) {
    warn(`Request failed: ${err}`);
    return null;
  }
};

export default { request };
