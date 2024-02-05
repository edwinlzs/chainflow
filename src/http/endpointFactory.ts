import { Endpoint, EndpointConfig, INodeWithValue } from './endpoint';
import { InputNode } from '../core/inputNode';

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
  #config: EndpointConfig = {};

  /** Sets configuration for all endpoints made by this factory. */
  config(config: EndpointConfig) {
    this.#config = config;
    return this;
  }

  /** Sets the base headers for all endpoints made by this factory. */
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
      // define methods to create endpoints from HTTP methods
      Reflect.defineProperty(this, method, {
        value: (path: string) => {
          return new Endpoint({ addr: this.#addr, method, path })
            .baseHeaders(this.#headers)
            .config(this.#config);
        },
      });
    });
  }
}
