import { ReqNode } from './reqNode';
import { debug } from 'debug';

const log = debug('chainflow:reqBuilder');

export type ReqNodes = { [key: string]: ReqNode };

export class ReqBuilder {
  #headers: ReqNodes = {};
  #params: ReqNodes = {};
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
      log(`Creating ReqNode for hash "${this.#hash}" with key "${key}"`);
      this.#body[key] = new ReqNode({
        val,
        hash: this.#hash,
      });
    });
  }
}
