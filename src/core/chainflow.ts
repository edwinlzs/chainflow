import { Endpoint } from './endpoint';
import debug from 'debug';

const log = debug('chainflow:chainflow');

export const SEED_HASH = 'seed';

type RespPayload = any;

/** Stores responses accumulated from endpoint calls in the current flow. */
export type Responses = { [callSignHash: string]: RespPayload[] };

/** Stores chain of endpoint calls. */
type Callstack = CallNode[];

/** Details on an endpoint call to be made. */
interface CallNode {
  endpoint: Endpoint;
  opts?: CallOpts;
}

// TODO: test call opts
/** Options for configuring an endpoint call. */
export interface CallOpts {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  pathParams?: Record<string, string>;
  body?: Record<string, any>;
}

/** Options for running chainflow. */
export interface RunOpts {
  seed?: Record<string, any>;
}

class Chainflow {
  #responses: Responses = {};
  #callstack: Callstack = [];

  /** Run the set up chain */
  async run(opts?: RunOpts) {
    log(`Running chainflow...`);

    if (opts?.seed) {
      this.#responses[SEED_HASH] = [opts.seed];
    }

    for (const { endpoint, opts } of this.#callstack) {
      // call endpoint
      const hash = endpoint.getHash();
      log(`Making a call to endpoint with hash "${hash}"`);
      try {
        const resp = await endpoint.call(this.#responses, opts);
        this.#responses[hash] = [resp];
      } catch (e) {
        log(`Chainflow stopped at endpoint with hash "${hash}": ${e}`);
        break;
      }
    }
    this.reset();
    log('Finished running chainflow.');
  }

  /** Adds an endpoint call to the callchain. */
  call(endpoint: Endpoint, opts?: CallOpts) {
    this.#callstack.push({ endpoint, opts });
    return this;
  }

  /** Resets the chainflow's state by clearing its accumulated responses. */
  reset() {
    this.#responses = {};
  }
}

export const chainflow = (): Chainflow => {
  return new Chainflow();
};
