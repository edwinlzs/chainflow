import { ACCEPTED_METHODS } from './chainflow.js';
import { Endpoint } from './endpoint.js';

/** Stores endpoints based on their route and methods. */
export class Route {
  [method: string]: Endpoint;

  constructor(endpoints: Endpoint[] = []) {
    endpoints.forEach((endpoint) => {
      const method = endpoint.method.toLowerCase();
      if (!ACCEPTED_METHODS.includes(method)) return;
      (this as any)[method] = endpoint;
    });
  }
}
