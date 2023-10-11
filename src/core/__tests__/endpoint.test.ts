import { describe, it, mock } from 'node:test';
import { Endpoint } from '../endpoint';
import assert from 'node:assert';
import http from '../../utils/http';

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
    const testEndpoint = new Endpoint({ method: 'post', route: '/user' });
    testEndpoint.req = testReqPayload;

    const respEndpoint = new Endpoint({ method: 'get', route: '/age' });
    const respPayload = {
      age: 10,
    };
    const responses = {
      [respEndpoint.getHash()]: [respPayload],
    };
    respEndpoint.res = respPayload;

    it('should expose its request nodes for setting up links', () => {
      testEndpoint.set((_, nodes) => {
        assert.deepEqual(Object.keys(nodes), Object.keys(testReqPayload));
      });
    });

    it('should use the default value if no RespNode is linked', async () => {
      const tracker = mock.method(http, 'httpReq');
      await testEndpoint.call(responses);

      assert.equal(tracker.mock.callCount(), 1);
      const call = tracker.mock.calls[0];

      assert.deepEqual(call.arguments?.[0]?.body, testReqPayload);
    });

    it('should use the available response value after a RespNode is linked to the ReqNode', async () => {
      const tracker = mock.method(http, 'httpReq');

      testEndpoint.set((link, nodes) => {
        link(nodes.details.age, respEndpoint.res.age);
      });
      await testEndpoint.call(responses);

      const call = tracker.mock.calls[0];
      assert.deepEqual(call.arguments?.[0]?.body, {
        id: 'some-id',
        name: 'some-name',
        details: {
          age: 10,
          member: true,
        },
      });
    });
  });
});
