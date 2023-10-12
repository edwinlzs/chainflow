import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { SUPPORTED_METHODS, chainflow } from '../chainflow';
import { Endpoint } from '../endpoint';
import { Route } from '../route';

describe('#chainflow', () => {
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

  it('should not actually make call if method is incorrect', async () => {
    const testChain = chainflow();
    const userEndpoint = new Endpoint({ path: '/user', method: 'get' });
    const user = new Route([userEndpoint]);

    const userTracker = mock.method(userEndpoint, 'call', () => ({}));

    await testChain.post(user).run();

    assert.equal(userTracker.mock.calls.length, 0);
  });
});
