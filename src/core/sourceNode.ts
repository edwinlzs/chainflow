import { NODE_VALUE } from './inputNode';
import { nodeHash, nodePath, nodeValueIdentifier, allowUndefined } from './utils/symbols';

/** Creates a new Source Node with the given hash. */
export const sourceNode = (hash: string) =>
  new Proxy({ path: [], hash }, SourceNodeHandler) as unknown as SourceNode;

/** Describes a value in a source node e.g. the output of an endpoint call. */
export interface SourceNode {
  [nodeHash]: string;
  [nodePath]: string[];
  [allowUndefined]?: boolean;
  [nodeValueIdentifier]: NODE_VALUE;
  [key: string]: SourceNode;
}

/** An intermediate object used to contain information on the SourceNode being built. */
interface RawSourceNode {
  path: string[];
  hash: string;
  allowUndefined?: boolean;
}

/** Generates proxies recursively to handle nested property access of a source signature. */
export const SourceNodeHandler = {
  get(obj: RawSourceNode, prop: any): unknown {
    switch (prop) {
      case nodePath:
        return obj.path;
      case nodeHash:
        return obj.hash;
      case allowUndefined:
        return obj.allowUndefined;
      case nodeValueIdentifier:
        return NODE_VALUE.SOURCE;
      default: {
        const newPath = [...obj.path];
        newPath.push(prop);
        return new Proxy(
          {
            path: newPath,
            hash: obj.hash,
            allowUndefined: obj.allowUndefined,
          },
          SourceNodeHandler,
        ) as unknown as SourceNode;
      }
    }
  },
  set(obj: RawSourceNode, prop: any, val: any) {
    if (prop === allowUndefined) return (obj.allowUndefined = val);
  },
};
