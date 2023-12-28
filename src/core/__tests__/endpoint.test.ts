import { describe, it, mock } from 'node:test';
import { Endpoint } from '../endpoint';
import assert from 'node:assert';
import http from '../../utils/http';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { link } from '../../utils/link';
import { gen, pool, required } from '../inputNode';

describe('#endpoint', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1:5000');
  const addr = '127.0.0.1:5000';

  const testReqPayload = {
    id: 'some-id',
    name: 'some-name',
    details: {
      age: 42,
      member: true,
    },
  };

  describe('when an unsupported method is passed to an endpoint', () => {
    it('should throw an error', () => {
      assert.throws(
        () => new Endpoint({ addr, method: 'NOnSeNsE', path: '/' }),
        /Method "nonsense" is not supported.$/,
      );
    });
  });

  describe('when a request payload is assigned to an endpoint', () => {
    const testEndpoint = new Endpoint({ addr, method: 'POST', path: '/user' }).body(testReqPayload);

    const respEndpoint = new Endpoint({ addr, method: 'GET', path: '/age' });
    const respPayload = {
      age: 10,
    };
    const responses = {
      [respEndpoint.getHash()]: [respPayload],
    };

    it('should expose its request nodes for setting up links', () => {
      testEndpoint.set((nodes) => {
        assert.deepEqual(Object.keys(nodes.body), Object.keys(testReqPayload));
      });
    });

    it('should use the default value if no SourceNode is linked', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});
      const tracker = mock.method(http, 'httpReq');
      await testEndpoint.call(responses);

      assert.equal(tracker.mock.callCount(), 1);
      const call = tracker.mock.calls[0];

      assert.deepEqual(call.arguments?.[0]?.body, JSON.stringify(testReqPayload));
    });

    it('should use the available response value after a SourceNode is linked to the InputNode', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});
      const tracker = mock.method(http, 'httpReq');

      testEndpoint.set((nodes) => {
        link(nodes.body.details.age, respEndpoint.resp.age);
      });
      await testEndpoint.call(responses);

      const call = tracker.mock.calls[0];
      assert.deepEqual(
        call.arguments?.[0]?.body,
        JSON.stringify({
          id: 'some-id',
          name: 'some-name',
          details: {
            age: 10,
            member: true,
          },
        }),
      );
    });

    it('should use values from a provided value pool', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});
      const tracker = mock.method(http, 'httpReq');
      const testValuePool = [10, 20, 30];

      const testReqPayloadWithValPool = {
        id: 'some-id',
        name: 'some-name',
        details: {
          age: pool(testValuePool),
          member: true,
        },
      };
      testEndpoint.body(testReqPayloadWithValPool);
      await testEndpoint.call(responses);

      const call = tracker.mock.calls[0];
      const callBody = JSON.parse(call.arguments?.[0]?.body);
      assert.ok(testValuePool.includes(callBody?.details?.age));
      assert.deepEqual(callBody, {
        id: 'some-id',
        name: 'some-name',
        details: {
          age: callBody?.details?.age,
          member: true,
        },
      });
    });

    it('should use values from a provided generator function', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});
      const tracker = mock.method(http, 'httpReq');
      const testValGen = () => 'michael-scott';

      const testReqPayloadWithValGen = {
        id: 'some-id',
        name: gen(testValGen),
        details: {
          age: 42,
          member: true,
        },
      };
      testEndpoint.body(testReqPayloadWithValGen);
      await testEndpoint.call(responses);

      const call = tracker.mock.calls[0];
      const callBody = JSON.parse(call.arguments?.[0]?.body);
      assert.deepEqual(callBody, {
        id: 'some-id',
        name: 'michael-scott',
        details: {
          age: 42,
          member: true,
        },
      });
    });
  });

  describe('#pathParams', () => {
    describe('when a path has one param', () => {
      const testEndpoint = new Endpoint({ addr, path: '/pet/{petId}', method: 'get' });

      it('should expose its path params for setting up links', () => {
        testEndpoint.set((nodes) => {
          assert.deepEqual(Object.keys(nodes.pathParams), ['petId']);
        });
      });

      it('should throw an error when called without values for path params', async () => {
        client
          .intercept({
            path: '/pet',
            method: 'GET',
          })
          .reply(200, {});
        const tracker = mock.method(http, 'httpReq');
        tracker.mock.resetCalls();

        assert.rejects(async () => await testEndpoint.call({}));
        assert.equal(tracker.mock.callCount(), 0);
      });
    });

    describe('when the path has multiple params', () => {
      const testEndpoint = new Endpoint({
        addr,
        path: '/user/{userId}/pet/{petId}',
        method: 'get',
      });

      it('should expose its path params for setting up links', () => {
        testEndpoint.set((nodes) => {
          assert.deepEqual(Object.keys(nodes.pathParams), ['userId', 'petId']);
        });
      });

      it('should throw an error when called without values for path params', async () => {
        client
          .intercept({
            path: '/pet',
            method: 'GET',
          })
          .reply(200, {});
        const tracker = mock.method(http, 'httpReq');
        tracker.mock.resetCalls();

        assert.rejects(async () => await testEndpoint.call({}));
        assert.equal(tracker.mock.callCount(), 0);
      });
    });
  });

  describe('when query params are assigned to an endpoint', () => {
    const testQuery = {
      cute: true,
    };
    const testEndpoint = new Endpoint({ addr, path: '/pet', method: 'get' });
    testEndpoint.query(testQuery);

    it('should expose its path params for setting up links', () => {
      testEndpoint.set((nodes) => {
        assert.deepEqual(Object.keys(nodes.query), ['cute']);
      });
    });

    it('should call the endpoint with the given query params', async () => {
      client
        .intercept({
          path: '/pet?cute=true',
          method: 'GET',
        })
        .reply(200, {});
      const tracker = mock.method(http, 'httpReq');
      tracker.mock.resetCalls();

      await testEndpoint.call({});
      assert.equal(tracker.mock.callCount(), 1);
    });
  });

  describe('when multiple query params are assigned to an endpoint', () => {
    const testQuery = {
      cute: true,
      iq: 200,
    };
    const testEndpoint = new Endpoint({ addr, path: '/pet', method: 'get' });
    testEndpoint.query(testQuery);

    it('should expose its path params for setting up links', () => {
      testEndpoint.set((nodes) => {
        assert.deepEqual(Object.keys(nodes.query), ['cute', 'iq']);
      });
    });

    it('should call the endpoint with the given query params', async () => {
      client
        .intercept({
          path: '/pet?cute=true&iq=200',
          method: 'GET',
        })
        .reply(200, {});
      const tracker = mock.method(http, 'httpReq');
      tracker.mock.resetCalls();

      await testEndpoint.call({});
      assert.equal(tracker.mock.callCount(), 1);
      assert.deepEqual(tracker.mock.calls[0].arguments[0]?.path, '/pet?cute=true&iq=200');
    });
  });

  describe('when custom headers are assigned to an endpoint', () => {
    const testHeaders = {
      token: 'some-token',
      'content-type': 'application/nonsense',
    };
    const testEndpoint = new Endpoint({ addr, path: '/auth', method: 'get' });
    testEndpoint.headers(testHeaders);

    it('should expose its headers for setting up links', () => {
      testEndpoint.set((nodes) => {
        assert.deepEqual(Object.keys(nodes.headers), ['token', 'content-type']);
      });
    });

    it('should call the endpoint with the given headers and override conflicting defaults', async () => {
      client
        .intercept({
          path: '/auth',
          method: 'GET',
        })
        .reply(200, {});

      const tracker = mock.method(http, 'httpReq');
      tracker.mock.resetCalls();

      await testEndpoint.call({});
      assert.equal(tracker.mock.callCount(), 1);
      assert.deepEqual(tracker.mock.calls[0].arguments[0]?.headers, {
        token: 'some-token',
        'content-type': 'application/nonsense',
      });
    });
  });

  describe('when provided call opts do not cover all the required values', () => {
    const testEndpoint = new Endpoint({ addr, path: '/user', method: 'post' }).body({
      details: {
        age: required(),
        name: required(),
      },
    });

    it('should throw an error indicating required values are not found', () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});

      const tracker = mock.method(http, 'httpReq');
      tracker.mock.resetCalls();

      assert.rejects(
        async () =>
          await testEndpoint.call(
            {},
            {
              body: {
                details: {
                  name: 'dude',
                },
              },
            },
          ),
      );
    });
  });
});
