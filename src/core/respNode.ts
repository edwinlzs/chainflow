import debug from 'debug';

const log = debug('respNode');

/** A data node for a received response. */
export class RespNode {
  /** Used to uniquely identify the endpoint this RespNode is under. */
  hash: string;
  /** Path to access desired value in a response payload */
  path: string;

  constructor({ val, hash, path }: { val: any; hash: string; path: string }) {
    this.hash = hash;

    this.path = path;
    if (typeof val === 'object') {
      Object.entries(val).forEach(([key, val]) => {
        const nextPath = `${path}.${key}`;
        log(`Creating RespNode for hash "${hash}" with path "${nextPath}"`);
        (this as any)[key] = new RespNode({
          val,
          hash,
          path: nextPath,
        });
      });
    }
  }
}
