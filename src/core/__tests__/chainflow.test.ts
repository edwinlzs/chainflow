import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { SUPPORTED_METHODS, chainflow } from '../chainflow';
import { Endpoint } from '../endpoint';
import { Route } from '../route';
import { MockAgent, setGlobalDispatcher } from 'undici';

describe('#chainflow', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1');

  it('should define methods for supported HTTP method types and a run command', () => {
    const testChain = chainflow();
    assert.deepEqual(
      Object.getOwnPropertyNames(testChain).sort(),
      ['run'].concat(SUPPORTED_METHODS).sort(),
    );
  });

  it('should allow API calls', async () => {
    const testChain = chainflow();
    const endpoint = new Endpoint({ path: '/user', method: 'get' });
    const route = new Route([endpoint]);

    const tracker = mock.method(endpoint, 'call', () => ({}));

    await testChain.get(route).run();

    assert.equal(tracker.mock.calls.length, 1);
  });

  it('should allow multiple API calls', async () => {
    const testChain = chainflow();
    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);
    const roleEndpoint = new Endpoint({ path: '/role', method: 'post' });
    const role = new Route([roleEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call', () => ({}));
    const roleTracker = mock.method(roleEndpoint, 'call', () => ({}));

    await testChain.get(user).post(role).get(user).run();

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

    const testChain = chainflow();
    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);
    const roleEndpoint = new Endpoint({ path: '/role', method: 'post' });
    const role = new Route([roleEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call');
    const roleTracker = mock.method(roleEndpoint, 'call');

    await testChain.get(user).post(role).get(user).run();

    assert.equal(userTracker.mock.calls.length, 1);
    assert.equal(roleTracker.mock.calls.length, 1);
  });

  it('should not actually make call if method is incorrect', async () => {
    const testChain = chainflow();
    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call', () => ({}));

    await testChain.post(user).run();

    assert.equal(userTracker.mock.calls.length, 0);
  });
});
