import { InputNode } from '../core/inputNode';

/** Contains node definitions for a request. */
export class ReqBuilder {
  baseHeaders: InputNode; // headers defined on the factory instead of the endpoint
  #headers: InputNode;
  pathParams: InputNode;
  #queryParams: InputNode;
  #body: InputNode;
  #hash: string;

  constructor({ hash }: { hash: string }) {
    this.#hash = hash;
    this.baseHeaders = new InputNode({ val: undefined, hash: this.#hash });
    this.#headers = new InputNode({ val: undefined, hash: this.#hash });
    this.pathParams = new InputNode({ val: undefined, hash: this.#hash });
    this.#queryParams = new InputNode({ val: undefined, hash: this.#hash });
    this.#body = new InputNode({ val: undefined, hash: this.#hash });
  }

  get body(): InputNode {
    return this.#body;
  }

  set body(payload: any) {
    this.#body = new InputNode({
      val: payload,
      hash: this.#hash,
    });
  }

  get query(): InputNode {
    return this.#queryParams;
  }

  set query(params: any) {
    this.#queryParams = new InputNode({
      val: params,
      hash: this.#hash,
    });
  }

  get headers(): InputNode {
    return this.#headers;
  }

  set headers(params: any) {
    this.#headers = new InputNode({
      val: params,
      hash: this.#hash,
    });
  }
}
