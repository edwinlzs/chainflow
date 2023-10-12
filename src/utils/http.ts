import { debug } from 'debug';
import { request } from 'undici';

const log = debug('http');

export type SUPPORTED_METHOD_UPPERCASE = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

const httpReq = async ({
  route,
  method,
  body,
}: {
  route: string;
  method: SUPPORTED_METHOD_UPPERCASE;
  body: any;
}) => {
  log(`${method} ${route} with payload ${JSON.stringify(body)}`);

  // TODO: insert actual endpoint call here
  await request(`http://${route}`, {
    method,
  });

  // TODO: error handling if call fails
};

export default { httpReq };
