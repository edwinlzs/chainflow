import { debug } from 'debug';
import { request } from 'undici';

const log = debug('chainflow:http');

export type SUPPORTED_METHOD_UPPERCASE = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export const defaultHeaders = {
  connection: 'keep-alive',
  accept: '*/*',
  'content-type': 'application/json',
  // 'User-Agent': 'Chainflow/0.1',
};

/** Sends a HTTP request. */
const httpReq = async ({
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
  log(`${method} ${addr}${path} ${body ? 'with payload' + JSON.stringify(body) : ''}`);

  try {
    const res = await request(`http://${addr}${path}`, {
      method,
      body,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
    return res;
  } catch (err) {
    log(`Request failed: ${err}`);
    return null;
  }
};

export default { httpReq };
