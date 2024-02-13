import { SourceValues } from './inputNode';
import { sourceNode } from './sourceNode';
import deepmergeSetup from '@fastify/deepmerge';
import { IStore } from './store';
import { log, warn } from './logger';
import { SEED_HASH, STORE_HASH } from './utils/constants';

const deepmerge = deepmergeSetup();

export interface CallResult {
  resp: any;
  store: IStore<unknown>;
}

/** Stores chain of endpoint calls. */
type Callqueue = CallNode[];

/** Defines an endpoint that a chainflow can call upon. */
export interface IEndpoint {
  hash: string;
  call: (sources: SourceValues, opts?: CallOpts) => Promise<CallResult>;
}

/** Details on an endpoint call to be made. */
interface CallNode {
  endpoint: IEndpoint;
  opts?: CallOpts;
}

/** Options for configuring an endpoint call. */
// TODO: decouple from chainflow in future versions.
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

/** Special object used to link an InputNode to a chainflow seed. */
export const seed = sourceNode(SEED_HASH);

/** Special object that acts as a central "gateway" between input and source values. */
export const store = sourceNode(STORE_HASH);

export class Chainflow {
  /** Stores sources such as the seed or values accumulated from
   * endpoint calls in the current flow. */
  #sources: SourceValues = {
    [STORE_HASH]: [{}],
  };
  #callqueue: Callqueue = [];

  /** Run the set up chain */
  async run(opts?: RunOpts) {
    log(`Running chainflow...`);

    if (opts?.seed) {
      this.#sources[SEED_HASH] = [opts.seed];
    }

    for (const { endpoint, opts } of this.#callqueue) {
      // call endpoint
      const hash = endpoint.hash;
      log(`Calling endpoint with hash "${hash}"`);
      try {
        const { resp, store } = await endpoint.call(this.#sources, opts);
        if (Object.keys(store).length > 0)
          this.#sources[STORE_HASH][0] = deepmerge(this.#sources[STORE_HASH][0], store);
        this.#sources[hash] = [resp];
      } catch (e) {
        warn(`Chainflow stopped at endpoint with hash "${hash}" and error: ${e}`);
        throw e;
      }
    }
    const sources = this.#sources;
    this.reset();
    log('Finished running chainflow.');
    return sources;
  }

  /** Adds an endpoint call to the callchain. */
  call(endpoint: IEndpoint, opts?: CallOpts) {
    this.#callqueue.push({ endpoint, opts });
    return this;
  }

  /** Resets the chainflow's state by clearing its accumulated sources. */
  reset() {
    this.#sources = {};
  }

  /** Creates a clone of this chainflow and its callqueue
   *  which can be extended and run independently. */
  clone(): Chainflow {
    const clone = new Chainflow();
    clone.#callqueue = [...this.#callqueue];
    return clone;
  }

  /** Extends this chainflow's callqueue with that of another flow. */
  extend(cf: Chainflow) {
    this.#callqueue.push(...cf.#callqueue);
    return this;
  }
}

export const chainflow = (): Chainflow => {
  return new Chainflow();
};
