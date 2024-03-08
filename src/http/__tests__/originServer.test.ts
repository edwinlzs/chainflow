import { originServer } from '../originServer';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { RESP_PARSER, httpClient } from '../utils/client';
import { testResponseOptions } from './_testUtils';

describe('#originServer', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1:5000');

  it('should create endpoints with HTTP methods based on the class method used', () => {
    const testOrigin = originServer();
    expect(testOrigin.get('/').method).toBe('get');
  });

  it('should create endpoints with any custom headers it has', async () => {
    client
      .intercept({
        path: '/',
        method: 'GET',
      })
      .reply(200);
    const testOrigin = originServer('127.0.0.1:5000').headers({
      token: 'some-token',
      'content-type': 'application/text',
    });
    const testEndpoint = testOrigin.get('/');

    const tracker = jest.spyOn(httpClient, 'request');
    tracker.mockClear();
    await testEndpoint.call({});

    expect(tracker).toHaveBeenCalledTimes(1);
    expect(tracker.mock.calls[0][0].headers).toStrictEqual({
      token: 'some-token',
      'content-type': 'application/text',
    });
  });

  it('should allow exposing headers to link resp nodes to them', () => {
    const testOrigin = originServer('127.0.0.1:5000').headers({
      token: 'some-token',
      'content-type': 'application/text',
    });
    testOrigin.set((nodes) => {
      expect(Object.keys(nodes.headers)).toStrictEqual(['token', 'content-type']);
    });
  });

  describe('when a config is defined on the origin', () => {
    const testOrigin = originServer('127.0.0.1:5000').config({
      respParser: RESP_PARSER.TEXT,
    });
    const testEndpoint = testOrigin.get('/test');

    it('should pass the config to any endpoints created from it', async () => {
      client
        .intercept({
          path: '/test',
          method: 'GET',
        })
        .reply(
          200,
          {
            hello: 'world',
          },
          testResponseOptions,
        );
      const { resp } = await testEndpoint.call({});

      expect(resp.body).toStrictEqual(
        JSON.stringify({
          hello: 'world',
        }),
      );
    });
  });

  describe('when headers are defined both on the origin and endpoint itself', () => {
    const testOrigin = originServer('127.0.0.1:5000').headers({
      token: 'some-token',
      'content-type': 'application/text',
    });
    const testEndpoint = testOrigin.get('/user').headers({
      'content-type': 'application/xml',
      animal: 'dog',
    });

    it('should merge headers with endpoint headers overriding conflicting origin headers', async () => {
      client
        .intercept({
          path: '/user',
          method: 'GET',
        })
        .reply(200);

      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();
      await testEndpoint.call({});

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][0].headers).toStrictEqual({
        token: 'some-token',
        'content-type': 'application/xml',
        animal: 'dog',
      });
    });
  });
});
