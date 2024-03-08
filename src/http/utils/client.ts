import { Dispatcher, request as undiciRequest } from 'undici';
import { log } from '../logger';
import { ParseResponseError, RequestFailedError } from '../errors';
import { SUPPORTED_METHOD } from './constants';

export type SUPPORTED_METHOD_UPPERCASE = Uppercase<SUPPORTED_METHOD>;

/** Formats to parse the response body. */
export enum RESP_PARSER {
  ARRAY_BUFFER = 'arrayBuffer',
  BLOB = 'blob',
  JSON = 'json',
  TEXT = 'text',
}

let _defaultHeaders: Record<string, string> | undefined = {
  'content-type': 'application/json',
  'User-Agent': 'Chainflow/0.1',
};

/** A utility to modify the default headers sent in every endpoint call. */
export const defaultHeaders = (headers?: Record<string, string>, replace?: boolean) => {
  replace
    ? (_defaultHeaders = headers)
    : (_defaultHeaders = {
        ..._defaultHeaders,
        ...headers,
      });
};

/** @todo explore allowing the client to be swapped out. */
export interface IHttpClient<Resp> {
  request: (params: IHttpReq) => Promise<Resp>;
}

export interface IHttpReq {
  url: string;
  method: SUPPORTED_METHOD_UPPERCASE;
  body?: any;
  headers?: Record<string, string>;
  respParser?: `${RESP_PARSER}`;
}

export type ParsedHttpResp = Omit<Dispatcher.ResponseData, 'body'> & { body: unknown };

/** Executes sending a HTTP request. */
const request = async ({ url, method, body, headers, respParser }: IHttpReq) => {
  const finalHeaders = {
    ..._defaultHeaders,
    ...headers,
  };

  log(
    `[${method}] [${url}] with headers %O${body ? ' and payload %O' : ''}`,
    finalHeaders,
    body ?? '',
  );

  const resp = await undiciRequest(url, {
    method,
    body: body ? JSON.stringify(body) : null /** @todo consider using buffer */,
    headers: Object.keys(finalHeaders).length > 0 ? finalHeaders : null,
  }).catch((err) => {
    throw new RequestFailedError(`${err}`);
  });

  return {
    ...resp,
    body: await parseResponse(resp, respParser).catch((err) => {
      throw new ParseResponseError(err);
    }),
  };
};

/** Parses a response body according to the specified parser. */
const parseResponse = async (resp: Dispatcher.ResponseData, respParser?: `${RESP_PARSER}`) => {
  switch (respParser) {
    case RESP_PARSER.ARRAY_BUFFER:
      return await resp.body.arrayBuffer();
    case RESP_PARSER.BLOB:
      return await resp.body.blob();
    case RESP_PARSER.TEXT:
      return await resp.body.text();
    case RESP_PARSER.JSON:
      return await resp.body.json();
    default:
      if (checkJsonSafe(resp)) return await resp.body.json();
      return await resp.body.text();
  }
};

/**
 * Check required to avoid errors when attempting `json()` on an empty body.
 * Refer to section under `ResponseData` at
 * https://github.com/nodejs/undici/blob/main/docs/docs/api/Dispatcher.md
 */
const checkJsonSafe = (resp: Dispatcher.ResponseData): boolean => {
  return Boolean(
    resp.statusCode !== 204 && resp.headers['content-type']?.includes('application/json'),
  );
};

export const httpClient: IHttpClient<ParsedHttpResp> = { request };
