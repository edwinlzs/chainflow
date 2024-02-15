import { InputNode } from '../core/inputNode';

/** Contains node definitions for a request. */
export class ReqBuilder {
  baseHeaders: InputNode; // headers defined on the origin instead of the endpoint
  #headers: InputNode;
  pathParams: InputNode;
  #queryParams: InputNode;
  #body: InputNode;

  constructor() {
    this.baseHeaders = new InputNode(undefined);
    this.#headers = new InputNode(undefined);
    this.pathParams = new InputNode(undefined);
    this.#queryParams = new InputNode(undefined);
    this.#body = new InputNode(undefined);
  }

  get body(): InputNode {
    return this.#body;
  }

  set body(payload: any) {
    this.#body = new InputNode(payload);
  }

  get query(): InputNode {
    return this.#queryParams;
  }

  set query(params: any) {
    this.#queryParams = new InputNode(params);
  }

  get headers(): InputNode {
    return this.#headers;
  }

  set headers(params: any) {
    this.#headers = new InputNode(params);
  }
}
