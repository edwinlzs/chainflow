import { Endpoint } from './endpoint.js';
import { Route } from './route.js';
import debug from 'debug';

const log = debug('chainflow:chainflow');

type RespPayload = any;
// type Routes = { [routeName: string]: Route };

/** Stores responses accumulated from endpoint calls in the current flow. */
export type Responses = { [callSignHash: string]: RespPayload[] };

/** Stores chain of endpoint calls. */
type Callstack = CallNode[];

/** Details on an endpoint call to be made. */
interface CallNode {
  endpoint: Endpoint;
  opts?: CallOpts;
}
/** Options for configuring an endpoint call. */
interface CallOpts {
  count?: number;
}

/** Function for registering an endpoint call in a chainflow. */
type EndpointCall = (route: Route, opts?: CallOpts) => Chainflow;

/** Chainflow with defined methods. */
type Chainflow = ChainflowBase & {
  get: EndpointCall;
  post: EndpointCall;
  put: EndpointCall;
  delete: EndpointCall;
  patch: EndpointCall;
  options: EndpointCall;
};

export type SUPPORTED_METHOD = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options';
export const SUPPORTED_METHODS: SUPPORTED_METHOD[] = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
];

class ChainflowBase {
  #responses: Responses = {};
  #callstack: Callstack = [];

  constructor() {
    SUPPORTED_METHODS.forEach((method) => {
      /** Makes a call for the given route and endpoint. */
      Reflect.defineProperty(this, method, {
        value: (route: Route, opts?: CallOpts) => {
          const endpoint = route[method];
          if (!endpoint) {
            return this;
          }
          this.#callstack.push({ endpoint, opts });
          return this;
        },
      });
    });
  }

  /** Run the set up chain */
  async run() {
    log(`Running chainflow...`);
    for (const { endpoint, opts } of this.#callstack) {
      // call endpoint
      const hash = endpoint.getHash();
      log(`Making a call to endpoint with hash "${hash}"`);
      const resp = await endpoint.call(this.#responses);
      if (resp == null) {
        log('Chainflow failed to run.');
        break;
      }
      this.#responses[hash] = [resp];
    }
    this.reset();
    log('Finished running chainflow.');
  }

  /** Resets the chainflow's state by clearing its callstack and accumulated responses. */
  reset() {
    this.#responses = {};
    this.#callstack = [];
  }
}

export const chainflow = (): Chainflow => {
  return new ChainflowBase() as Chainflow;
};
