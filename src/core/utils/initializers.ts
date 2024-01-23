import { NodeValue } from '../inputNode';
import { nodeValueIdentifier } from './symbols';

/** Defines a set of values to choose from when constructing an input. */
export const pool = (valuePool: any[]) => ({
  valuePool,
  [nodeValueIdentifier]: NodeValue.ValuePool,
});

/** Provides a generator function to produce a value for an input. */
export const gen = (generator: () => any) => ({
  generator,
  [nodeValueIdentifier]: NodeValue.Generator,
});

/** Used to mark a param without a default value
 * as required to be taken from another source. */
export const required = () => ({
  [nodeValueIdentifier]: NodeValue.Required,
});
