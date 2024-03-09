import { Endpoint, EndpointConfig, INodeWithValue } from './endpoint';
import { InputNode } from '../core/inputNode';
import { SUPPORTED_METHODS } from './utils/constants';

/** Convenience function for creating an endpoint builder
 * with supported HTTP methods defined on it. */
export const origin = (origin?: string) => new OriginBase(origin) as Origin;

/** Function for defining a new endpoint. */
type MakeEndpoint = (path: string) => Endpoint;

export type Origin = OriginBase & {
  get: MakeEndpoint;
  post: MakeEndpoint;
  put: MakeEndpoint;
  delete: MakeEndpoint;
  patch: MakeEndpoint;
  options: MakeEndpoint;
};

/** Stores the base url and defines methods to build endpoints with methods. */
class OriginBase {
  #origin?: string;
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

  constructor(origin?: string) {
    this.#origin = origin;
    this.#headers = new InputNode(undefined);
    SUPPORTED_METHODS.forEach((method) => {
      // define methods to create endpoints from HTTP methods
      Reflect.defineProperty(this, method, {
        value: (path: string) => {
          return new Endpoint({ url: `${this.#origin ?? ''}${path}`, method })
            .baseHeaders(this.#headers)
            .config(this.#config);
        },
      });
    });
  }
}
