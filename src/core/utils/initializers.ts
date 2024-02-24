import { NODE_VALUE } from '../inputNode';
import { nodeValueIdentifier } from './symbols';

/** Provides a generator function to produce a value for an input. */
export const gen = (generator: () => any) => ({
  generator,
  [nodeValueIdentifier]: NODE_VALUE.GENERATOR,
});

/** Used to mark a param without a default value
 * as required to be taken from another source. */
export const required = () => ({
  [nodeValueIdentifier]: NODE_VALUE.REQUIRED,
});
