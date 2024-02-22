import { InputNode } from '../inputNode';
import { getNodeValue } from '../utils/symbols';

describe('#inputNode', () => {
  const testVal = {
    id: 'some-id',
    name: 'some-name',
    details: {
      age: 42,
      member: true,
    },
  };

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
  });

  describe('when the node value is an array', () => {
    const testNode = new InputNode(['hello', 40, false]);
    expect(testNode[getNodeValue]({}, [], [])).toStrictEqual(['hello', 40, false]);
  });

  describe('when the node value is a non-array object', () => {
    const testNode = new InputNode(testVal);
    it('should save the object info as children within the node', () => {
      expect(Object.keys(testNode)).toStrictEqual(Object.keys(testVal));
    });

    it('should reconstruct the object as node value', () => {
      expect(testNode[getNodeValue]({}, [], [])).toStrictEqual(testVal);
    });
  });
});
