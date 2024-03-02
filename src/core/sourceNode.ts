import { NODE_VALUE } from './inputNode';
import { sourceId, nodePath, nodeValueIdentifier, allowUndefined } from './utils/symbols';

/** Creates a new Source Node with the given id. */
export const sourceNode = (id: string) =>
  new Proxy({ path: [], id }, SourceNodeHandler) as unknown as SourceNode;

/** Describes a value in a source node e.g. the output of an endpoint call. */
export interface SourceNode {
  [sourceId]: string;
  [nodePath]: string[];
  [allowUndefined]?: boolean;
  [nodeValueIdentifier]: NODE_VALUE;
  [key: string]: SourceNode;
}

/** An intermediate object used to contain information on the SourceNode being built. */
interface RawSourceNode {
  path: string[];
  id: string;
  allowUndefined?: boolean;
}

/** Generates proxies recursively to handle nested property access of a source signature. */
export const SourceNodeHandler = {
  get(obj: RawSourceNode, prop: any): unknown {
    switch (prop) {
      case nodePath:
        return obj.path;
      case sourceId:
        return obj.id;
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
            id: obj.id,
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
