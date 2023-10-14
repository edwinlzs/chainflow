import { SUPPORTED_METHOD, SUPPORTED_METHODS } from './chainflow.js';
import { Endpoint } from './endpoint.js';
import debug from 'debug';

const log = debug('chainflow:route');

/** Stores endpoints based on their route and methods. */
export class Route {
  #host: string;
  [method: string]: Endpoint;

  constructor(endpoints: Endpoint[] = [], host?: string) {
    this.#host = host ?? '127.0.0.1';
    endpoints.forEach((endpoint) => {
      if (!SUPPORTED_METHODS.includes(endpoint.method as SUPPORTED_METHOD)) return;
      log(
        `Registering endpoint with hash "${endpoint.getHash()}" under route with host: "${
          this.#host
        }"`,
      );
      (this as any)[endpoint.method] = endpoint;
      endpoint.host = this.#host;
    });
  }
}
