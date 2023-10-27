import { SUPPORTED_METHOD, SUPPORTED_METHODS } from './chainflow.js';
import { Endpoint } from './endpoint.js';
import debug from 'debug';

const log = debug('chainflow:route');

/** Convenience function for creating a route. */
export const route = (endpoints: Endpoint[] = [], address?: string) =>
  new Route(endpoints, address);

/** Stores endpoints based on their route and methods. */
export class Route {
  #address: string;
  [method: string]: Endpoint;

  constructor(endpoints: Endpoint[] = [], address: string = '127.0.0.1') {
    this.#address = address;
    endpoints.forEach((endpoint) => {
      if (!SUPPORTED_METHODS.includes(endpoint.method as SUPPORTED_METHOD)) return;
      log(
        `Registering endpoint with hash "${endpoint.getHash()}" under route with address: "${
          this.#address
        }"`,
      );
      (this as any)[endpoint.method] = endpoint;
      endpoint.address(this.#address);
    });
  }
}
