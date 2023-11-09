import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ReqNode } from '../reqNode';
import { getNodeValue, setValuePool } from '../../utils/symbols';

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

  describe('when the node value is an array', () => {
    const testNode = new ReqNode({ val: ['hello', 40, false], hash: 'some-hash' });
    assert.deepEqual(testNode[getNodeValue]({}), ['hello', 40, false]);
  });

  describe('when the node value is a non-array object', () => {
    const testNode = new ReqNode({ val: testVal, hash: 'some-hash' });
    it('should save the object info as children within the node', () => {
      assert.deepEqual(Object.keys(testNode), Object.keys(testVal));
    });

    it('should reconstruct the object as node value', () => {
      assert.deepEqual(testNode[getNodeValue]({}), testVal);
    });
  });

  describe('when a value pool is provided for a node', () => {
    const testNode = new ReqNode({ val: 40, hash: 'some-hash' });
    const testValuePool = [10, 20, 30];
    testNode[setValuePool](testValuePool);
    assert.ok(testValuePool.includes(testNode[getNodeValue]({})));
  });
});
