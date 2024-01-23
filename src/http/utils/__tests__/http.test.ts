import { describe, it, mock } from 'node:test';
import http, { defaultHeaders } from '../client';
import assert from 'node:assert';
import undici from 'undici';

describe('#http', () => {
  describe('when the request throws an error', () => {
    it('should return null', async () => {
      mock.method(undici, 'request', () => {
        throw new Error('Request failed!');
      });
      const resp = await http.httpReq({
        addr: '127.0.0.1',
        path: '/user',
        method: 'GET',
      });
      assert.equal(resp, null);
    });
  });

  describe('when custom headers are given', () => {
    it('should override conflicting default headers', async () => {
      const tracker = mock.method(undici, 'request', () => {
        throw new Error('Request failed!');
      });
      await http.httpReq({
        addr: '127.0.0.1',
        path: '/user',
        method: 'GET',
        headers: {
          token: 'some-token',
          'content-type': 'application/nonsense',
        },
      });

      assert.equal(tracker.mock.callCount(), 1);
      assert.deepEqual(tracker.mock.calls[0].arguments[1]?.headers, {
        ...defaultHeaders,
        token: 'some-token',
        'content-type': 'application/nonsense',
      });
    });
  });
});
