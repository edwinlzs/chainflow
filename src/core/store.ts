import { CallResult } from './chainflow';
import { SourceNode } from './sourceNode';
import { nodePath, undefinedAllowed } from './utils/symbols';

export type StoreValue<T> = IStore<T> | T;
export interface IStore<T> {
  [key: string]: StoreValue<T>;
}

/** Manages the storing of values for an endpoint. */
export class Store {
  /** Definition of values to be stored from responses to this endpoint. */
  def: IStore<SourceNode> = {};
  /** Actual store of values received */
  #store: IStore<unknown> = {};

  /** Assigns values to be put in the chainflow's store. */
  storeValues(resp: unknown): CallResult {
    Object.entries(this.def).map(([key, val]) => {
      if ((val as SourceNode)[nodePath]) {
        // SourceNode
        const { found, value, storePath } = this.#accessRespValue(resp, [key], val as SourceNode);
        if (found && storePath) this.#putInStore(storePath, value);
      } else {
        // a nested store value
        this.#getStoreValue(resp, [key], val);
      }
    });

    const store = this.#store;
    this.#store = {}; // resets the store
    return { resp: resp, store };
  }

  /** Looks for a value defined in the store definition. */
  #getStoreValue(resp: unknown, currentPath: string[], storeDef: IStore<SourceNode>) {
    Object.entries(storeDef).map(([key, val]) => {
      if ((val as SourceNode)[nodePath]) {
        // SourceNode
        const { found, value, storePath } = this.#accessRespValue(
          resp,
          [...currentPath, key],
          val as SourceNode,
        );
        if (found && storePath) this.#putInStore(storePath, value);
      } else {
        // a nested store value
        this.#getStoreValue(resp, [...currentPath, key], val);
      }
    });
  }

  /** Use a storeDef's defined path to search for a value in the response object. */
  #accessRespValue(resp: unknown, storePath: string[], source: SourceNode) {
    const sourcePath = source[nodePath];
    let sourceVal = resp as unknown;

    let i = 0;
    while (i < sourcePath.length) {
      // recall that `typeof null` returns 'object'
      if (sourceVal == null || typeof sourceVal !== 'object') {
        if (source[undefinedAllowed]) return { found: true, value: sourceVal, storePath };
        return { found: false };
      }
      const accessor = sourcePath[i]!;
      sourceVal = (sourceVal as Record<string, unknown>)[accessor];
      i += 1;
    }

    return { found: true, value: sourceVal, storePath };
  }

  /** Places the found response value in the store according to the store path defined. */
  #putInStore(storePath: string[], value: unknown) {
    let storeNode: any = this.#store;
    let accessor;
    for (let i = 0; i < storePath.length; i++) {
      accessor = storePath[i];
      if (i === storePath.length - 1) {
        // reached final node
        storeNode[accessor] = value;
        break;
      }

      if (storeNode[accessor] === undefined) {
        storeNode[accessor] = {};
      }
      storeNode = storeNode[accessor];
    }
  }
}
