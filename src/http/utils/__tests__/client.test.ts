import http, { defaultHeaders } from '../client';
import undici from 'undici';

describe('#client', () => {
  describe('when the request throws an error', () => {
    it('should return null', async () => {
      undici.request = jest.fn(() => {
        throw new Error('Request failed!');
      });
      const resp = await http.request({
        addr: 'http://127.0.0.1',
        path: '/user',
        method: 'GET',
      });
      expect(resp).toBeNull();
    });
  });

  describe('when custom headers are given', () => {
    it('should override conflicting default headers', async () => {
      undici.request = jest.fn(() => {
        throw new Error('Request failed!');
      });
      const tracker = jest.spyOn(undici, 'request');
      await http.request({
        addr: 'http://127.0.0.1',
        path: '/user',
        method: 'GET',
        headers: {
          token: 'some-token',
          'content-type': 'application/nonsense',
        },
      });

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][1]?.headers).toStrictEqual({
        ...defaultHeaders,
        token: 'some-token',
        'content-type': 'application/nonsense',
      });
    });
  });
});
