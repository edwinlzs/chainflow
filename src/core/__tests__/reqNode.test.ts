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
    it('should save the value as the default', () => {
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
});
