import { ReqNode } from './reqNode';

/** Contains node definitions for a request. */
export class ReqBuilder {
  baseHeaders: ReqNode; // headers defined on the factory instead of the endpoint
  #headers: ReqNode;
  pathParams: ReqNode;
  #queryParams: ReqNode;
  #body: ReqNode;
  #hash: string;

  constructor({ hash }: { hash: string }) {
    this.#hash = hash;
    this.baseHeaders = new ReqNode({ val: undefined, hash: this.#hash });
    this.#headers = new ReqNode({ val: undefined, hash: this.#hash });
    this.pathParams = new ReqNode({ val: undefined, hash: this.#hash });
    this.#queryParams = new ReqNode({ val: undefined, hash: this.#hash });
    this.#body = new ReqNode({ val: undefined, hash: this.#hash });
  }

  get body(): ReqNode {
    return this.#body;
  }

  set body(payload: any) {
    this.#body = new ReqNode({
      val: payload,
      hash: this.#hash,
    });
  }

  get query(): ReqNode {
    return this.#queryParams;
  }

  set query(params: any) {
    this.#queryParams = new ReqNode({
      val: params,
      hash: this.#hash,
    });
  }

  get headers(): ReqNode {
    return this.#headers;
  }

  set headers(params: any) {
    this.#headers = new ReqNode({
      val: params,
      hash: this.#hash,
    });
  }
}
