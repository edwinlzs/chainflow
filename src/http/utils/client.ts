import { Dispatcher, request as undiciRequest } from 'undici';
import { log, warn } from '../logger';

export type SUPPORTED_METHOD_UPPERCASE = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

/** @todo evaluate if defaults should change */
export let _defaultHeaders: Record<string, string> | undefined = {
  'content-type': 'application/json',
  'User-Agent': 'Chainflow/0.1',
};

export const defaultHeaders = (headers?: Record<string, string>, replace?: boolean) => {
  replace
    ? (_defaultHeaders = headers)
    : (_defaultHeaders = {
        ..._defaultHeaders,
        ...headers,
      });
};

export interface IHttpClient<T> {
  request: (params: {
    addr: string;
    path: string;
    method: SUPPORTED_METHOD_UPPERCASE;
    body?: any;
    headers?: Record<string, string>;
  }) => Promise<T>;
}

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
    ..._defaultHeaders,
    ...headers,
  };

  log(
    `[${method}] [${addr}${path}] with headers %O${body ? ' and payload %O' : ''}`,
    finalHeaders,
    body ?? '',
  );

  try {
    const resp = await undiciRequest(`${addr}${path}`, {
      method,
      body: body ? JSON.stringify(body) : null,
      headers: Object.keys(finalHeaders).length > 0 ? finalHeaders : null,
    });

    return resp;
  } catch (err) {
    warn(`Request failed: ${err}`);
    return null;
  }
};

export let httpClient: IHttpClient<any> = { request } as IHttpClient<Dispatcher.ResponseData>;

/** Allows user to use their own HTTP client */
export const configureHttpClient = (client: IHttpClient<unknown>) => {
  httpClient = client;
};

/**
 * Check required to avoid errors when attempting `json()` on an empty body.
 * Refer to issue under `ResponseData` at
 * https://github.com/nodejs/undici/blob/main/docs/docs/api/Dispatcher.md
 */
export const checkJsonSafe = (resp: Dispatcher.ResponseData): boolean => {
  return Boolean(
    resp.statusCode !== 204 && resp.headers['content-type']?.includes('application/json'),
  );
};
