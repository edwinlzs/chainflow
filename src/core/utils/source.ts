import { NodeValue } from '../inputNode';
import { SourceNode } from '../sourceNode';
import { nodeValueIdentifier } from './symbols';

// TODO: add covering tests
export const source = (source: SourceNode, callback?: () => any) => ({
  [nodeValueIdentifier]: NodeValue.SourceWithCallback,
  source,
  callback,
});

// TODO: add covering tests
export const sources = (sources: SourceNode[], callback?: () => any) => ({
  [nodeValueIdentifier]: NodeValue.Sources,
  sources,
  callback,
});
