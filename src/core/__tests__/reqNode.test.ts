import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ReqNode, getNodeValue } from '../reqNode';

describe('#reqNode', () => {
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
      const testNode = new ReqNode({ val: 'Hello World!', hash: 'some-hash' });
      assert.equal(testNode[getNodeValue]({}), 'Hello World!');
    });

    it('should save boolean values as the default', () => {
      const testNode = new ReqNode({ val: false, hash: 'some-hash' });
      assert.equal(testNode[getNodeValue]({}), false);
    });

    it('should save number values as the default', () => {
      const testNode = new ReqNode({ val: 40, hash: 'some-hash' });
      assert.equal(testNode[getNodeValue]({}), 40);
    });
  });

  describe('when the node value is an object', () => {
    const testNode = new ReqNode({ val: testVal, hash: 'some-hash' });
    it('should save the object info as children within the node', () => {
      assert.deepEqual(Object.keys(testNode), Object.keys(testVal));
    });

    it('should reconstruct the object as node value', () => {
      assert.deepEqual(testNode[getNodeValue]({}), testVal);
    });
  });

  describe('when the node value is an unhandled data type', () => {
    it('should throw an error', () => {
      assert.throws(
        () => new ReqNode({ val: Symbol('some-symbol'), hash: 'some-hash' }),
        /Unhandled value type: "symbol"$/,
      );
    });
  });

  // TODO: implement array handling
  describe('when the node value is an array', () => {
    it('should throw an error', () => {
      assert.throws(
        () => new ReqNode({ val: ['some-string', 50, false], hash: 'some-hash' }),
        /Unhandled value type: "array"$/,
      );
    });
  });

  // TODO: implement null handling?
  describe('when the node value is null', () => {
    it('should throw an error', () => {
      assert.throws(
        () => new ReqNode({ val: null, hash: 'some-hash' }),
        /Unhandled value type: "null"$/,
      );
    });
  });
});
