import { SourceValues } from './inputNode';
import { sourceNode } from './sourceNode';
import deepmergeSetup from '@fastify/deepmerge';
import { IStore } from './store';
import { log, warn } from './logger';
import { SEED_ID, STORE_ID } from './utils/constants';

const deepmerge = deepmergeSetup();

export interface CallResult {
  resp: any;
  store?: IStore<unknown>;
}

/** Defines an endpoint that a chainflow can call upon. */
export interface IEndpoint<T> {
  /** A value that uniquely identifies this endpoint. */
  id: string;
  call: (sources: SourceValues, opts?: T) => Promise<CallResult>;
}

/** Details on an endpoint call to be made. */
interface CallNode<T> {
  endpoint: IEndpoint<T>;
  opts?: T;
}

/** Stores chain of endpoint calls. */
type Callqueue = CallNode<any>[];

/** Special object used to link an InputNode to a chainflow seed. */
export const seed = sourceNode(SEED_ID);

/** Special object that acts as a central "gateway" between input and source values. */
export const store = sourceNode(STORE_ID);

export class Chainflow {
  /** Stores sources such as the seed or values accumulated from
   * endpoint calls in the current flow. */
  #sources: SourceValues = {};
  /** Stores the sources that this chainflow was initialized with. */
  #initSources: SourceValues = {};
  #callqueue: Callqueue = [];

  /** Run the set up chain */
  async run() {
    log(`Running chainflow...`);
    this.reset();
    this.#sources = this.#initSources;
    this.#sources[STORE_ID] = [{}];

    for (const { endpoint, opts } of this.#callqueue) {
      // call endpoint
      const id = endpoint.id;
      log(`Calling endpoint with id "${id}"`);
      try {
        const { resp, store } = await endpoint.call(this.#sources, opts);
        if (store && Object.keys(store).length > 0)
          this.#sources[STORE_ID][0] = deepmerge(this.#sources[STORE_ID][0], store);
        this.#sources[id] = [resp];
      } catch (e) {
        warn(`Chainflow stopped at endpoint with id "${id}" and error: ${e}`);
        throw e;
      }
    }
    log('Finished running chainflow.');
    return this;
  }

  /** Adds a seed to this chainflow. */
  seed(seed: Record<string, any>) {
    this.#initSources[SEED_ID] = [seed];
    return this;
  }

  /** Adds an endpoint call to the callchain. */
  call<T>(endpoint: IEndpoint<T>, opts?: T) {
    this.#callqueue.push({ endpoint, opts });
    return this;
  }

  /** Resets the chainflow's state by clearing its accumulated sources. */
  reset() {
    this.#sources = {};
  }

  /** Creates a clone of this chainflow's callqueue and initial sources
   *  which can be extended and run independently. */
  clone(): Chainflow {
    const clone = new Chainflow();
    clone.#initSources = structuredClone(this.#initSources);
    clone.#callqueue = [...this.#callqueue];
    return clone;
  }

  /** Extends this chainflow's callqueue with that of another flow. */
  extend(cf: Chainflow) {
    this.#callqueue.push(...cf.#callqueue);
    return this;
  }

  /** Causes this chainflow to continue from the state of
   * sources values of another chainflow. */
  continuesFrom(cf: Chainflow) {
    this.#initSources = { ...this.#initSources, ...cf.#sources };
    return this;
  }

  /** @todo Returns the accumulated responses of this chainflow. */
  responses() {}
}

export const chainflow = (): Chainflow => {
  return new Chainflow();
};
