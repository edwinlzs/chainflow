import { NodeValue } from './inputNode';
import { nodeHash, nodePath, nodeValueIdentifier, undefinedAllowed } from './utils/symbols';

/** Creates a new Source Node with the given hash. */
export const sourceNode = (hash: string) =>
  new Proxy({ path: [], hash }, SourceNodeHandler) as unknown as SourceNode;

/** Describes a value in a source node e.g. the output of an endpoint call. */
export interface SourceNode {
  [nodeHash]: string;
  [nodePath]: string[];
  [undefinedAllowed]?: boolean;
  [nodeValueIdentifier]: NodeValue;
  [key: string]: any;
}

/** An intermediate object used to contain information on the SourceNode being built. */
interface RawSourceNode {
  path: string[];
  hash: string;
  undefinedAllowed?: boolean;
}

/** Generates proxies recursively to handle nested property access of a source signature. */
export const SourceNodeHandler = {
  get(obj: RawSourceNode, prop: any): any {
    switch (prop) {
      case nodePath:
        return obj.path;
      case nodeHash:
        return obj.hash;
      case undefinedAllowed:
        return obj.undefinedAllowed;
      case nodeValueIdentifier:
        return NodeValue.Source;
      default: {
        const newPath = [...obj.path];
        newPath.push(prop);
        return new Proxy(
          {
            path: newPath,
            hash: obj.hash,
            undefinedAllowed: obj.undefinedAllowed,
          },
          SourceNodeHandler,
        ) as unknown as SourceNode;
      }
    }
  },
  set(obj: RawSourceNode, prop: any, val: any) {
    if (prop === undefinedAllowed) return (obj.undefinedAllowed = val);
  },
};
