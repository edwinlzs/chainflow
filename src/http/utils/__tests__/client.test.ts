import { httpClient, defaultHeaders } from '../client';
import undici from 'undici';

describe('#client', () => {
  describe('when the request throws an error', () => {
    it('should return null', async () => {
      undici.request = jest.fn(() => {
        throw new Error('Request failed!');
      });
      const resp = await httpClient.request({
        addr: 'http://127.0.0.1',
        path: '/user',
        method: 'GET',
      });
      expect(resp).toBeNull();
    });
  });

  describe('when custom headers are given', () => {
    it('should overwrite the default headers', async () => {
      undici.request = jest.fn();
      const tracker = jest.spyOn(undici, 'request');
      await httpClient.request({
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
        token: 'some-token',
        'content-type': 'application/nonsense',
        'User-Agent': 'Chainflow/0.1',
      });
    });
  });

  describe('when default headers are modified', () => {
    it('should overwrite the default headers', async () => {
      undici.request = jest.fn();
      defaultHeaders({
        'content-type': 'application/some-nonsense',
      });
      const tracker = jest.spyOn(undici, 'request');
      await httpClient.request({
        addr: 'http://127.0.0.1',
        path: '/user',
        method: 'GET',
      });

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][1]?.headers).toStrictEqual({
        'content-type': 'application/some-nonsense',
        'User-Agent': 'Chainflow/0.1',
      });
    });

    it('should replace the default headers when replace is true', async () => {
      undici.request = jest.fn();
      defaultHeaders(
        {
          'content-type': 'application/more-nonsense',
        },
        true,
      );
      const tracker = jest.spyOn(undici, 'request');
      await httpClient.request({
        addr: 'http://127.0.0.1',
        path: '/user',
        method: 'GET',
      });

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][1]?.headers).toStrictEqual({
        'content-type': 'application/more-nonsense',
      });
    });

    it('should have no headers when defaults are replaced with empty headers', async () => {
      undici.request = jest.fn();
      defaultHeaders(
        {},
        true,
      );
      const tracker = jest.spyOn(undici, 'request');
      await httpClient.request({
        addr: 'http://127.0.0.1',
        path: '/user',
        method: 'GET',
      });

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][1]?.headers).toBe(null);
    });
  });
});
