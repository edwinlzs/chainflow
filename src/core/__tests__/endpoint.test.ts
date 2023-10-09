import { describe, it } from 'node:test';
import { Endpoint } from '../endpoint';
import assert from 'node:assert';
import { ResNode } from '../nodes';

describe('#endpoint', () => {
  const testReqPayload = {
    id: 'some-id',
    name: 'some-name',
    details: {
      age: 42,
      member: true,
    },
  };

  describe('when a request payload is assigned to an endpoint', () => {
    const testResNode = new ResNode({ val: 10, hash: 'some-hash', path: 'some-path' });
    const testEndpoint = new Endpoint({ method: 'get', route: '/user' });
    testEndpoint.req = testReqPayload;

    it('should allow setting links for its request nodes', () => {
      testEndpoint.set((link, nodes) => {
        assert.deepEqual(Object.keys(nodes), Object.keys(testReqPayload));
      });
    });
  });
});
