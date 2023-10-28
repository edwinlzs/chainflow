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

  it('should break chainflow if an endpoint call returns an error code', async () => {
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

    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);
    const roleEndpoint = new Endpoint({ path: '/role', method: 'post' });
    const role = new Route([roleEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call');
    const roleTracker = mock.method(roleEndpoint, 'call');

    await chainflow().get(user).post(role).get(user).run();

    assert.equal(userTracker.mock.calls.length, 1);
    assert.equal(roleTracker.mock.calls.length, 1);
  });

  it('should not actually make call if method is incorrect', async () => {
    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call', () => ({}));

    await chainflow().post(user).run();

    assert.equal(userTracker.mock.calls.length, 0);
  });

  it('should reset its state after a run so future runs use a clean slate', async () => {
    client
      .intercept({
        path: '/user',
        method: 'POST',
      })
      .reply(200, {
        userId: 'userId A',
      });
    const userEndpoint = new Endpoint({ path: '/user', method: 'post' }).body({
      name: 'Tom',
    });
    const user = new Route([userEndpoint]);

    const roleEndpoint = new Endpoint({ path: '/role', method: 'post' }).body({
      userId: 'defaultId',
    });
    const role = new Route([roleEndpoint]);

    const roleTracker = mock.method(roleEndpoint, 'call');

    const testFlow = chainflow().post(user).post(role);
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

    await testFlow.run();

    assert.equal(roleTracker.mock.calls.length, 2);
    assert.deepEqual(roleTracker.mock.calls[1].arguments[0], {
      [userEndpoint.getHash()]: [
        {
          userId: 'userId B',
        },
      ],
    });
  });

  it('should use value from another linked response if the first available linked response does not have value', async () => {
    const tracker = mock.method(http, 'httpReq');
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

    await testFlow.run();

    assert.equal(tracker.mock.calls.length, 3);
    const roleCall1 = tracker.mock.calls[2];
    const callBody1 = JSON.parse(roleCall1.arguments?.[0]?.body);
    assert.deepEqual(callBody1, {
      name: 'A',
    });

    // when higher priority response does not have the correct source node
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

    await testFlow.run();

    assert.equal(tracker.mock.calls.length, 6);
    const roleCall2 = tracker.mock.calls[5];
    const callBody2 = JSON.parse(roleCall2.arguments?.[0]?.body);
    assert.deepEqual(callBody2, {
      name: 'B',
    });
  });
});
