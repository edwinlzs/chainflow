import { debug } from 'debug';

const log = debug('http');

const httpReq = async ({ hash, body }: { hash: string; body: any }) => {
  log(`Calling API with hash "${hash}" and payload ${JSON.stringify(body)}`);

  // TODO: insert actual endpoint call here

  // TODO: error handling if call fails
};

export default { httpReq };
