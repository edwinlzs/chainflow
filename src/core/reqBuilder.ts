import { ReqNode } from './reqNode';
import { debug } from 'debug';

const log = debug('chainflow:reqBuilder');

export type ReqNodes = { [key: string]: ReqNode };

export class ReqBuilder {
  #headers: ReqNodes = {};
  pathParams: ReqNodes = {};
  #queryParams: ReqNodes = {};
  #body: ReqNodes = {};
  #hash: string;

  constructor({ hash }: { hash: string }) {
    this.#hash = hash;
  }

  get body() {
    return this.#body;
  }

  set body(payload: any) {
    Object.entries(payload).forEach(([key, val]) => {
      log(`Creating body ReqNode for hash "${this.#hash}" with key "${key}"`);
      this.#body[key] = new ReqNode({
        val,
        hash: this.#hash,
      });
    });
  }

  get query() {
    return this.#queryParams;
  }

  set query(params: any) {
    Object.entries(params).forEach(([key, val]) => {
      log(`Creating query param ReqNode for hash "${this.#hash}" with key "${key}"`);
      this.#queryParams[key] = new ReqNode({
        val,
        hash: this.#hash,
      });
    });
  }

  get headers() {
    return this.#headers;
  }

  set headers(params: any) {
    Object.entries(params).forEach(([key, val]) => {
      log(`Creating header ReqNode for hash "${this.#hash}" with key "${key}"`);
      this.#headers[key] = new ReqNode({
        val,
        hash: this.#hash,
      });
    });
  }
}
