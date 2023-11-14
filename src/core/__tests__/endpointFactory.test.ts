import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { endpointFactory } from '../endpointFactory';
import http from '../../utils/http';

describe('#endpointFactory', () => {
  it('should create endpoints with HTTP methods based on the class method used', () => {
    const testFactory = endpointFactory();
    assert.equal(testFactory.get('/').method, 'get');
  });

  it('should create endpoints with any custom headers it has', async () => {
    const testFactory = endpointFactory().headers({
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
});
