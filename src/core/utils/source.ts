import { NodeValue } from '../inputNode';
import { SourceNode } from '../sourceNode';
import { nodeValueIdentifier } from './symbols';

export const source = (source: SourceNode, callback?: (val: any) => any) => ({
  [nodeValueIdentifier]: NodeValue.SourceWithCallback,
  source,
  callback,
});

/** @experimental - evaluating if this is important enough to retain */
export const sources = (sources: SourceNode[], callback?: (val: any) => any) => ({
  [nodeValueIdentifier]: NodeValue.Sources,
  sources,
  callback,
});
