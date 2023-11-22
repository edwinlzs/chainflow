import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { endpointFactory } from '../endpointFactory';
import http from '../../utils/http';
import { MockAgent, setGlobalDispatcher } from 'undici';

describe('#endpointFactory', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1:5000');

  it('should create endpoints with HTTP methods based on the class method used', () => {
    const testFactory = endpointFactory();
    assert.equal(testFactory.get('/').method, 'get');
  });

  it('should create endpoints with any custom headers it has', async () => {
    client
      .intercept({
        path: '/',
        method: 'GET',
      })
      .reply(200, {});
    const testFactory = endpointFactory('127.0.0.1:5000').headers({
      token: 'some-token',
      'content-type': 'application/text',
    });
    const testEndpoint = testFactory.get('/');

    const tracker = mock.method(http, 'httpReq');
    await testEndpoint.call({});

    assert.equal(tracker.mock.callCount(), 1);
    assert.deepEqual(tracker.mock.calls[0].arguments[0].headers, {
      token: 'some-token',
      'content-type': 'application/text',
    });
  });

  it('should allow exposing headers to link resp nodes to them', () => {
    const testFactory = endpointFactory('127.0.0.1:5000').headers({
      token: 'some-token',
      'content-type': 'application/text',
    });

    testFactory.set((nodes) => {
      assert.deepEqual(Object.keys(nodes.headers), ['token', 'content-type']);
    });
  });
});
