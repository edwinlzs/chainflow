import { InputNode } from '../inputNode';
import { getNodeValue } from '../utils/symbols';
import { gen, required } from '../utils/initializers';
import { config } from '../utils/config';
import { link, linkMerge } from '../utils/link';
import { sourceNode } from '../sourceNode';

describe('#inputNode', () => {
  describe('setting defaults', () => {
    describe('when the node value is not an object', () => {
      it('should save string values as the default', () => {
        const testNode = new InputNode('Hello World!');
        expect(testNode[getNodeValue]({}, [], [])).toBe('Hello World!');
      });

      it('should save boolean values as the default', () => {
        const testNode = new InputNode(false);
        expect(testNode[getNodeValue]({}, [], [])).toBe(false);
      });

      it('should save number values as the default', () => {
        const testNode = new InputNode(40);
        expect(testNode[getNodeValue]({}, [], [])).toBe(40);
      });

      it('should save null as the default', () => {
        const testNode = new InputNode(null);
        expect(testNode[getNodeValue]({}, [], [])).toBe(null);
      });

      it('should save undefined as the default', () => {
        const testNode = new InputNode(undefined);
        expect(testNode[getNodeValue]({}, [], [])).toBe(undefined);
      });
    });

    describe('when the node value is an array', () => {
      const testNode = new InputNode(['hello', 40, false]);
      expect(testNode[getNodeValue]({}, [], [])).toStrictEqual(['hello', 40, false]);
    });

    describe('when the node value is a non-array object', () => {
      const testVal = {
        id: 'some-id',
        name: 'some-name',
        details: {
          age: 42,
          member: true,
        },
      };

      const testNode = new InputNode(testVal);
      it('should save the object info as children within the node', () => {
        expect(Object.keys(testNode)).toStrictEqual(Object.keys(testVal));
      });

      it('should reconstruct the object as node value', () => {
        expect(testNode[getNodeValue]({}, [], [])).toStrictEqual(testVal);
      });
    });
  });

  describe('generators', () => {
    const testNode = new InputNode(gen(() => 'generatedValue'));
    it('should return a generated value', () => {
      expect(testNode[getNodeValue]({}, [], [])).toBe('generatedValue');
    });
  });

  describe('required', () => {
    const testNode = new InputNode(required());
    const missingValues: string[][] = [];
    it('should mark the source value as missing', () => {
      testNode[getNodeValue]({}, missingValues, ['root']);
      expect(missingValues).toEqual([['root']]);
    });
  });

  describe('linked values', () => {
    describe('single source', () => {
      describe('when given source has value available', () => {
        const testNode = new InputNode(sourceNode('some-hash').value);
        it('should retrieve value from given source when available', () => {
          const val = testNode[getNodeValue]({ 'some-hash': [{ value: 42 }] }, [], []);
          expect(val).toBe(42);
        });
      });

      describe('when given source has a callback', () => {
        const testNode = new InputNode(
          link(sourceNode('some-hash').value, (val: number) => val + 58),
        );
        it('should retrieve value from given source when available', () => {
          const val = testNode[getNodeValue]({ 'some-hash': [{ value: 42 }] }, [], []);
          expect(val).toBe(42 + 58);
        });
      });

      describe('when source value is null', () => {
        const testNode = new InputNode(sourceNode('some-hash').root.value);
        it('should retrieve value from given source', () => {
          const val = testNode[getNodeValue]({ 'some-hash': [{ root: undefined }] }, [], []);
          expect(val).toBe(undefined);
        });
      });

      describe('when source value is unavailable and undefined is allowed', () => {
        const testNode = new InputNode(
          config(sourceNode('some-hash').value, { allowUndefined: true }),
        );
        it('should retrieve value from given source', () => {
          const missingValues: string[][] = [];
          const val = testNode[getNodeValue]({ 'some-hash': [{}] }, missingValues, []);
          expect(val).toBe(undefined);
          expect(missingValues).toEqual([]);
        });
      });
    });

    describe('multiple sources', () => {
      describe('when one of the sources does not have a value available', () => {
        const testNode = new InputNode(sourceNode('hash-1').value);
        link(testNode, sourceNode('hash-2').value);

        it('should retrieve value from second source', () => {
          const val = testNode[getNodeValue]({ 'hash-1': [{}], 'hash-2': [{ value: 20 }] }, [], []);
          expect(val).toBe(20);
        });
      });
    });

    describe('merge sources', () => {
      describe('when given an array of sources', () => {
        const testNode = new InputNode(
          linkMerge(
            [sourceNode('hash-1').value, sourceNode('hash-2').other.value],
            ([val1, val2]) => val1 + val2,
          ),
        );
        it('should retrieve value from given source when available', () => {
          const val = testNode[getNodeValue](
            { 'hash-1': [{ value: 42 }], 'hash-2': [{ other: { value: 58 } }] },
            [],
            [],
          );
          expect(val).toBe(42 + 58);
        });
      });

      describe('when given an object of sources', () => {
        const testNode = new InputNode(
          linkMerge(
            { value1: sourceNode('hash-1').value, value2: sourceNode('hash-2').other.value },
            ({ value1, value2 }) => value1 + value2,
          ),
        );
        it('should retrieve value from given source when available', () => {
          const val = testNode[getNodeValue](
            { 'hash-1': [{ value: 42 }], 'hash-2': [{ other: { value: 58 } }] },
            [],
            [],
          );
          expect(val).toBe(42 + 58);
        });
      });

      describe('when linking merge sources with input node as an argument', () => {
        const testNode = new InputNode(1);
        linkMerge(
          testNode,
          { value1: sourceNode('hash-1').value, value2: sourceNode('hash-2').other.value },
          ({ value1, value2 }) => value1 + value2,
        );
        it('should retrieve value from given source when available', () => {
          const val = testNode[getNodeValue](
            { 'hash-1': [{ value: 42 }], 'hash-2': [{ other: { value: 58 } }] },
            [],
            [],
          );
          expect(val).toBe(42 + 58);
        });
      });

      describe('when one source is unavailable', () => {
        const testNode = new InputNode(
          linkMerge(
            [sourceNode('hash-1').value, sourceNode('hash-2').other.value],
            ([val1, val2]) => val1 + val2,
          ),
        );
        it('should not construct merge sources value', () => {
          const val = testNode[getNodeValue](
            { 'hash-1': [{}], 'hash-2': [{ other: { value: 58 } }] },
            [],
            [],
          );
          expect(val).toBe(undefined);
        });
      });
    });
  });
});
