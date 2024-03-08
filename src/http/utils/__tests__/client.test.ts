import { testResponseOptions } from '../../__tests__/_testUtils';
import { ParseResponseError, RequestFailedError } from '../../errors';
import { httpClient, defaultHeaders } from '../client';
import undici from 'undici';

describe('#client', () => {
  describe('when the request throws an error', () => {
    it('should throw a RequestFailedError', async () => {
      undici.request = jest.fn(async () => {
        throw new Error('Request failed!');
      });

      await expect(
        httpClient.request({
          url: 'http://127.0.0.1/user',
          method: 'GET',
        }),
      ).rejects.toThrow(new RequestFailedError(`${new Error('Request failed!')}`));
    });
  });

  describe('when the client fails to parse the response body', () => {
    it('should throw a ParseResponseError', async () => {
      undici.request = jest.fn().mockImplementationOnce(async () => ({
        ...testResponseOptions,
        statusCode: 200,
        body: {
          arrayBuffer: jest.fn(),
          blob: jest.fn(),
          text: jest.fn(),
          json: jest.fn(async () => {
            throw new Error('Failed to parse body!');
          }),
        },
      }));

      await expect(
        httpClient.request({
          url: 'http://127.0.0.1/user',
          method: 'GET',
        }),
      ).rejects.toThrow(new ParseResponseError(`${new Error('Failed to parse body!')}`));
    });
  });

  beforeEach(() => {
    undici.request = jest.fn().mockImplementationOnce(async () => ({
      ...testResponseOptions,
      statusCode: 200,
      body: {
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        text: jest.fn(),
        json: jest.fn(),
      },
    }));
  });

  describe('when custom headers are given', () => {
    it('should overwrite the default headers', async () => {
      const tracker = jest.spyOn(undici, 'request');
      await httpClient.request({
        url: 'http://127.0.0.1/user',
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
      defaultHeaders({
        'content-type': 'application/some-nonsense',
      });
      const tracker = jest.spyOn(undici, 'request');
      await httpClient.request({
        url: 'http://127.0.0.1/user',
        method: 'GET',
      });

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][1]?.headers).toStrictEqual({
        'content-type': 'application/some-nonsense',
        'User-Agent': 'Chainflow/0.1',
      });
    });

    it('should replace the default headers when replace is true', async () => {
      defaultHeaders(
        {
          'content-type': 'application/more-nonsense',
        },
        true,
      );
      const tracker = jest.spyOn(undici, 'request');
      await httpClient.request({
        url: 'http://127.0.0.1/user',
        method: 'GET',
      });

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][1]?.headers).toStrictEqual({
        'content-type': 'application/more-nonsense',
      });
    });

    it('should have no headers when defaults are replaced with empty headers', async () => {
      defaultHeaders({}, true);
      const tracker = jest.spyOn(undici, 'request');
      await httpClient.request({
        url: 'http://127.0.0.1/user',
        method: 'GET',
      });

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][1]?.headers).toBe(null);
    });
  });
});
