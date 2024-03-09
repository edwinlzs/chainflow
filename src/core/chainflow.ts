import { SourceValues } from './inputNode';
import { sourceNode } from './sourceNode';
import deepmergeSetup from '@fastify/deepmerge';
import { IStore } from './store';
import { log, warn } from './logger';
import { SEED_ID, STORE_ID } from './utils/constants';

const deepmerge = deepmergeSetup();

export interface CallResult<Req, Resp> {
  req: Req;
  resp: Resp;
  store?: IStore<unknown>;
}

/** Defines an endpoint that a chainflow can call upon. */
export interface IEndpoint<CallOpts, Req, Resp> {
  /** Uniquely identifies this endpoint. */
  id: string;
  /** Describes the endpoint. */
  details: string;
  call: (sources: SourceValues, opts?: CallOpts) => Promise<CallResult<Req, Resp>>;
}

/** Details on an endpoint call to be made. */
interface CallNode<CallOpts, Req, Resp> {
  endpoint: IEndpoint<CallOpts, Req, Resp>;
  opts?: CallOpts;
}

interface CallEvent {
  details: string;
  req: unknown;
  resp: unknown;
}

/** Stores a set of endpoint calls to be made. */
type Callqueue = CallNode<any, any, any>[];

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
  /** Stores accumulated endpoint call events. */
  events: CallEvent[] = [];

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
      const { req, resp, store } = await endpoint.call(this.#sources, opts).catch((err) => {
        warn(`Chainflow stopped at endpoint with id "${id}" and error: ${err}`);
        throw err;
      });
      if (store && Object.keys(store).length > 0)
        this.#sources[STORE_ID][0] = deepmerge(this.#sources[STORE_ID][0], store);
      this.#sources[id] = [resp];
      this.events.push({ details: endpoint.details, req, resp });
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
  call<CallOpts, Req, Resp>(endpoint: IEndpoint<CallOpts, Req, Resp>, opts?: CallOpts) {
    this.#callqueue.push({ endpoint, opts });
    return this;
  }

  /** Resets the chainflow's state by clearing its accumulated sources. */
  reset() {
    this.#sources = {};
    this.events = [];
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
}

export const chainflow = (): Chainflow => {
  return new Chainflow();
};
