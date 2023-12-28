import { Endpoint } from './endpoint';
import debug from 'debug';
import { InputNode, INodeWithValue } from './inputNode';

const log = debug('chainflow:route');

export type SUPPORTED_METHOD = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options';
export const SUPPORTED_METHODS: SUPPORTED_METHOD[] = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
];

/** Convenience function for creating an endpoint builder with supported methods defined on it. */
export const endpointFactory = (addr?: string) => new EndpointFactoryBase(addr) as EndpointFactory;

/** Function for making a new endpoint. */
type MakeEndpoint = (path: string) => Endpoint;

export type EndpointFactory = EndpointFactoryBase & {
  get: MakeEndpoint;
  post: MakeEndpoint;
  put: MakeEndpoint;
  delete: MakeEndpoint;
  patch: MakeEndpoint;
  options: MakeEndpoint;
};

/** Stores the base address and defines methods to build endpoints with methods. */
export class EndpointFactoryBase {
  #addr: string;
  #headers: InputNode;
  #hash: string;

  headers(params: Record<string, string | INodeWithValue | undefined>) {
    this.#headers = new InputNode({
      val: params,
      hash: this.#hash,
    });
    return this;
  }

  /** Configure linking of this Req's input nodes. */
  set(setter: ({ headers }: { headers: InputNode }) => void) {
    setter({
      headers: this.#headers,
    });
    return this;
  }

  constructor(addr: string = '127.0.0.1') {
    this.#addr = addr;
    this.#headers = new InputNode({ val: undefined, hash: addr });
    this.#hash = addr;
    SUPPORTED_METHODS.forEach((method) => {
      /** Makes a call for the given route and endpoint. */
      Reflect.defineProperty(this, method, {
        value: (path: string) => {
          log(`Creating endpoint for "${method} ${this.#addr}${path}"`);
          return new Endpoint({ addr: this.#addr, method, path }).baseHeaders(this.#headers);
        },
      });
    });
  }
}
