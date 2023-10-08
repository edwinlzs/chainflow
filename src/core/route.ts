import { Endpoint } from "./endpoint.js";

export class Route {
  [method: string]: Endpoint;

  constructor(endpoints: { [method: string]: Endpoint } = {}) {
    Object.entries(endpoints).forEach(([method, endpoint]) => {
      (this as any)[method] = endpoint;
    });
  }
}