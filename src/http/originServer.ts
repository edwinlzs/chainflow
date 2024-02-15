import { Endpoint, EndpointConfig, INodeWithValue } from './endpoint';
import { InputNode } from '../core/inputNode';
import { SUPPORTED_METHODS } from './utils/constants';

/** Convenience function for creating an endpoint builder with supported methods defined on it. */
export const originServer = (addr?: string) => new OriginBase(addr) as OriginServer;

/** Function for making a new endpoint. */
type MakeEndpoint = (path: string) => Endpoint;

export type OriginServer = OriginBase & {
  get: MakeEndpoint;
  post: MakeEndpoint;
  put: MakeEndpoint;
  delete: MakeEndpoint;
  patch: MakeEndpoint;
  options: MakeEndpoint;
};

/** Stores the base address and defines methods to build endpoints with methods. */
class OriginBase {
  #addr: string;
  #headers: InputNode;
  #config: EndpointConfig = {};

  /** Sets configuration for all endpoints made by this origin. */
  config(config: EndpointConfig) {
    this.#config = config;
    return this;
  }

  /** Sets the base headers for all endpoints made by this origin. */
  headers(params: Record<string, string | INodeWithValue | undefined>) {
    this.#headers = new InputNode(params);
    return this;
  }

  /** Configure linking of this Req's input nodes. */
  set(setter: ({ headers }: { headers: InputNode }) => void) {
    setter({
      headers: this.#headers,
    });
    return this;
  }

  constructor(addr: string = 'http://127.0.0.1') {
    this.#addr = addr;
    this.#headers = new InputNode(undefined);
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
