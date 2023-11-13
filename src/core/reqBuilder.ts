import { ReqNode } from './reqNode';

export type ReqNodes = { [key: string]: ReqNode };

/** Contains node definitions for a request. */
export class ReqBuilder {
  #headers: ReqNode | undefined;
  pathParams: ReqNode | undefined;
  #queryParams: ReqNode | undefined;
  #body: ReqNode | undefined;
  #hash: string;

  constructor({ hash }: { hash: string }) {
    this.#hash = hash;
  }

  get body(): ReqNode | undefined {
    return this.#body;
  }

  set body(payload: any) {
    this.#body = new ReqNode({
      val: payload,
      hash: this.#hash,
    });
  }

  get query(): ReqNode | undefined {
    return this.#queryParams;
  }

  set query(params: any) {
    this.#queryParams = new ReqNode({
      val: params,
      hash: this.#hash,
    });
  }

  get headers(): ReqNode | undefined {
    return this.#headers;
  }

  set headers(params: any) {
    this.#headers = new ReqNode({
      val: params,
      hash: this.#hash,
    });
  }
}
