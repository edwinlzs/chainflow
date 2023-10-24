import { describe, it, mock } from 'node:test';
import http from '../http';
import assert from 'node:assert';
import undici from 'undici';

describe('#http', () => {
  describe('when the request throws an error', () => {
    it('should return null', async () => {
      const tracker = mock.method(undici, 'request', () => {
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
});
