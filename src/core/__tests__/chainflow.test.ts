import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { SUPPORTED_METHODS, chainflow } from '../chainflow';
import { Endpoint } from '../endpoint';
import { Route } from '../route';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { link } from '../../utils/inputs';
import http from '../../utils/http';

describe('#chainflow', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1');

  it('should define methods for supported HTTP method types', () => {
    assert.deepEqual(Object.getOwnPropertyNames(chainflow()).sort(), SUPPORTED_METHODS.sort());
  });

  it('should allow API calls', async () => {
    const endpoint = new Endpoint({ path: '/user', method: 'get' });
    const route = new Route([endpoint]);

    const tracker = mock.method(endpoint, 'call', () => ({}));

    await chainflow().get(route).run();

    assert.equal(tracker.mock.calls.length, 1);
  });

  it('should allow multiple API calls', async () => {
    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);
    const roleEndpoint = new Endpoint({ path: '/role', method: 'post' });
    const role = new Route([roleEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call', () => ({}));
    const roleTracker = mock.method(roleEndpoint, 'call', () => ({}));

    await chainflow().get(user).post(role).get(user).run();

    assert.equal(userTracker.mock.calls.length, 2);
    assert.equal(roleTracker.mock.calls.length, 1);
  });

  it('should not execute actual call if method is incorrect', async () => {
    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call', () => ({}));

    await chainflow().post(user).run();

    assert.equal(userTracker.mock.calls.length, 0);
  });

  describe('when an endpoint call returns an error code', () => {
    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);
    const roleEndpoint = new Endpoint({ path: '/role', method: 'post' });
    const role = new Route([roleEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call');
    const roleTracker = mock.method(roleEndpoint, 'call');

    it('should break the chainflow', async () => {
      client
        .intercept({
          path: '/user',
          method: 'GET',
        })
        .reply(200, {});
      client
        .intercept({
          path: '/role',
          method: 'POST',
        })
        .reply(400, {});
      await chainflow().get(user).post(role).get(user).run();

      assert.equal(userTracker.mock.calls.length, 1);
      assert.equal(roleTracker.mock.calls.length, 1);
    });
  });

  describe('when a chainflow has finished a run', () => {
    const userEndpoint = new Endpoint({ path: '/user', method: 'post' }).body({
      name: 'Tom',
    });
    const user = new Route([userEndpoint]);

    const roleEndpoint = new Endpoint({ path: '/role', method: 'post' }).body({
      userId: 'defaultId',
    });
    const role = new Route([roleEndpoint]);

    const testFlow = chainflow().post(user).post(role);
    const roleTracker = mock.method(roleEndpoint, 'call');

    it('should reset its state so future runs use a clean slate', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {
          userId: 'userId A',
        });
      roleTracker.mock.resetCalls();
      await testFlow.run();

      assert.equal(roleTracker.mock.calls.length, 1);
      assert.deepEqual(roleTracker.mock.calls[0].arguments[0], {
        [userEndpoint.getHash()]: [
          {
            userId: 'userId A',
          },
        ],
      });

      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {
          userId: 'userId B',
        });

      roleTracker.mock.resetCalls();
      await testFlow.run();

      assert.equal(roleTracker.mock.calls.length, 1);
      assert.deepEqual(roleTracker.mock.calls[0].arguments[0], {
        [userEndpoint.getHash()]: [
          {
            userId: 'userId B',
          },
        ],
      });
    });
  });

  describe('when multiple responses are linked to a request', () => {
    const userPostEndpoint = new Endpoint({ path: '/user', method: 'post' });
    const userGetEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userPostEndpoint, userGetEndpoint]);

    const roleEndpoint = new Endpoint({ path: '/role', method: 'post' }).body({
      name: 'defaultName',
    });
    const role = new Route([roleEndpoint]);

    role.post.set(({ body: { name } }) => {
      link(name, user.post.resp.details.name);
      link(name, user.get.resp.details.name);
    });
    const testFlow = chainflow().post(user).get(user).post(role);
    const tracker = mock.method(http, 'httpReq');

    describe('when both linked responses have the source value', () => {
      it('should use the value of the response with higher priority', async () => {
        client
          .intercept({
            path: '/user',
            method: 'POST',
          })
          .reply(200, {
            details: {
              name: 'A',
            },
          });

        client
          .intercept({
            path: '/user',
            method: 'GET',
          })
          .reply(200, {
            details: {
              name: 'B',
            },
          });
        tracker.mock.resetCalls();
        await testFlow.run();
        assert.equal(tracker.mock.calls.length, 3);
        const roleCall = tracker.mock.calls[2];
        const callBody = JSON.parse(roleCall.arguments?.[0]?.body);
        assert.deepEqual(callBody, {
          name: 'A',
        });
      });
    });

    describe('when the first available linked response does not have value', () => {
      it('should use value from another linked response ', async () => {
        client
          .intercept({
            path: '/user',
            method: 'POST',
          })
          .reply(200, {
            details: null,
          });

        client
          .intercept({
            path: '/user',
            method: 'GET',
          })
          .reply(200, {
            details: {
              name: 'B',
            },
          });
        tracker.mock.resetCalls();
        await testFlow.run();
        assert.equal(tracker.mock.calls.length, 3);
        const roleCall = tracker.mock.calls[2];
        const callBody = JSON.parse(roleCall.arguments?.[0]?.body);
        assert.deepEqual(callBody, {
          name: 'B',
        });
        tracker.mock.resetCalls();
      });
    });
  });

  describe('when a callback is provided for a linked value', () => {
    const client = agent.get('http://127.0.0.1');
    const userPostEndpoint = new Endpoint({ path: '/user', method: 'post' }).body({
      name: 'Tom',
    });
    const rolePostEndpoint = new Endpoint({ path: '/role', method: 'post' }).body({
      userId: 'defaultId',
    });
    const user = new Route([userPostEndpoint]);
    const role = new Route([rolePostEndpoint]);

    const testCallback = (userId: string) => `${userId} has been modified`;
    rolePostEndpoint.set(({ body: { userId } }) => {
      link(userId, user.post.resp.userId, testCallback);
    });
    const tracker = mock.method(http, 'httpReq');

    it('should call the endpoint with the given query params', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {
          userId: 'newUserId',
        });
      tracker.mock.resetCalls();
      await chainflow().post(user).post(role).run();

      assert.equal(tracker.mock.callCount(), 2);
      const roleCall = tracker.mock.calls[1];
      const roleCallBody = JSON.parse(roleCall?.arguments[0]?.body);
      assert.deepEqual(roleCallBody, {
        userId: 'newUserId has been modified',
      });
    });
  });
});
