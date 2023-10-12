import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RespNode } from '../respNode';

describe('#respNode', () => {
  const testVal = {
    id: 'some-id',
    name: 'some-name',
    details: {
      age: 42,
      member: true,
    },
  };

  it('should save the object path to access the node', () => {
    const testNode = new RespNode({
      val: testVal,
      hash: 'some-hash',
      path: 'some-path',
    });
    assert.equal(testNode.path, 'some-path');
  });
});
