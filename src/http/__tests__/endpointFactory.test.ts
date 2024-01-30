import { endpointFactory } from '../endpointFactory';
import http from '../utils/client';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { RespParser } from '../endpoint';

describe('#endpointFactory', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1:5000');

  it('should create endpoints with HTTP methods based on the class method used', () => {
    const testFactory = endpointFactory();
    expect(testFactory.get('/').method).toBe('get');
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

    const tracker = jest.spyOn(http, 'httpReq');
    tracker.mockClear();
    await testEndpoint.call({});

    expect(tracker).toHaveBeenCalledTimes(1);
    expect(tracker.mock.calls[0][0].headers).toStrictEqual({
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
      expect(Object.keys(nodes.headers)).toStrictEqual(['token', 'content-type']);
    });
  });

  describe('when a config is defined on the factory', () => {
    const testFactory = endpointFactory('127.0.0.1:5000').config({
      respParser: RespParser.Text,
    });
    const testEndpoint = testFactory.get('/test');

    it('should pass the config to any endpoints created from it', async () => {
      client
        .intercept({
          path: '/test',
          method: 'GET',
        })
        .reply(200, {
          hello: 'world',
        });
      const resp = await testEndpoint.call({});

      expect(resp.body).toStrictEqual(
        JSON.stringify({
          hello: 'world',
        }),
      );
    });
  });

  describe('when headers are defined both on the factory and endpoint itself', () => {
    const testFactory = endpointFactory('127.0.0.1:5000').headers({
      token: 'some-token',
      'content-type': 'application/text',
    });
    const testEndpoint = testFactory.get('/user').headers({
      'content-type': 'application/xml',
      animal: 'dog',
    });

    it('should merge headers with endpoint headers overriding conflicting factory headers', async () => {
      client
        .intercept({
          path: '/user',
          method: 'GET',
        })
        .reply(200, {});

      const tracker = jest.spyOn(http, 'httpReq');
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
