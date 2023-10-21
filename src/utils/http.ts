import { debug } from 'debug';
import { Client, request } from 'undici';

const log = debug('http');

export type SUPPORTED_METHOD_UPPERCASE = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

const headers = {
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
}: {
  addr: string;
  path: string;
  method: SUPPORTED_METHOD_UPPERCASE;
  body?: any;
}) => {
  log(`${method} ${addr}${path} ${body ? 'with payload' + JSON.stringify(body) : ''}`);
  const client = new Client(`http://${addr}`);

  try {
    // TODO: insert actual endpoint call here
    const res = await request(`http://${addr}${path}`, {
      method,
      body,
      headers,
    });
  } catch (err) {
    log(`Request failed: ${err}`);
  }

  // TODO: error handling if call fails
};

export default { httpReq };
