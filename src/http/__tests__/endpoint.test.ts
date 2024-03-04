import { RESP_PARSER, Endpoint } from '../endpoint';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { link, linkMerge } from '../../core/utils/link';
import { gen, required } from '../../core/utils/initializers';
import { RequiredValuesNotFoundError } from '../errors';
import { httpClient } from '../utils/client';
import { testResponseOptions } from './_testUtils';

// used to maintain URL paths uniqueness to avoid one test's calls
// from being picked up by another test's interceptor
let deconflictor = 0;
const uniquePath = (path: string) => {
  ++deconflictor;
  return `${path}-${deconflictor}`;
};

describe('#endpoint', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1:5000');
  const addr = '127.0.0.1:5000';

  const testReqPayload = {
    id: 'some-id',
    name: 'some-name',
    details: {
      age: 42,
      member: true,
    },
  };

  describe('when an unsupported method is passed to an endpoint', () => {
    it('should throw an error', () => {
      expect(() => new Endpoint({ addr, method: 'NOnSeNsE', path: '/' })).toThrow(
        /Method "nonsense" is not supported.$/,
      );
    });
  });

  describe('when the endpoint is configured', () => {
    describe('when the response parser is configured', () => {
      it('should parse a response body as a string when parser is set to text', async () => {
        const testEndpoint = new Endpoint({
          addr,
          method: 'POST',
          path: '/text-parser-test',
        }).config({ respParser: RESP_PARSER.TEXT });
        client
          .intercept({
            path: '/text-parser-test',
            method: 'POST',
          })
          .reply(
            200,
            {
              hello: 'world',
            },
            testResponseOptions,
          );

        const { resp } = await testEndpoint.call({});
        expect(resp.body).toBe(
          JSON.stringify({
            hello: 'world',
          }),
        );
      });

      it('should parse a response body as an object when parser is set to json', async () => {
        const testEndpoint = new Endpoint({ addr, method: 'POST', path: '/json-parser-test' });
        client
          .intercept({
            path: '/json-parser-test',
            method: 'POST',
          })
          .reply(
            200,
            {
              hello: 'world',
            },
            testResponseOptions,
          );

        const { resp } = await testEndpoint.call({});
        expect(resp.body).toStrictEqual({
          hello: 'world',
        });
      });

      it('should parse a response body as a blob when parser is set to blob', async () => {
        const testEndpoint = new Endpoint({
          addr,
          method: 'POST',
          path: '/blob-parser-test',
        }).config({ respParser: RESP_PARSER.BLOB });
        client
          .intercept({
            path: '/blob-parser-test',
            method: 'POST',
          })
          .reply(200, {
            hello: 'world',
          });

        const { resp } = await testEndpoint.call({});
        expect(resp.body).toStrictEqual(
          new Blob([
            JSON.stringify({
              hello: 'world',
            }),
          ]),
        );
      });

      it('should parse a response body as an arrayBuffer when parser is set to arrayBuffer', async () => {
        const testEndpoint = new Endpoint({
          addr,
          method: 'POST',
          path: '/arrayBuffer-parser-test',
        }).config({ respParser: RESP_PARSER.ARRAY_BUFFER });
        client
          .intercept({
            path: '/arrayBuffer-parser-test',
            method: 'POST',
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
          await new Blob([
            JSON.stringify({
              hello: 'world',
            }),
          ]).arrayBuffer(),
        );
      });

      it('should parse a response body as JSON when parser is set to json, regardless of headers', async () => {
        const testEndpoint = new Endpoint({
          addr,
          method: 'POST',
          path: '/arrayBuffer-parser-test',
        }).config({ respParser: RESP_PARSER.JSON });
        client
          .intercept({
            path: '/arrayBuffer-parser-test',
            method: 'POST',
          })
          .reply(200, {
            hello: 'world',
          });

        const { resp } = await testEndpoint.call({});
        expect(resp.body).toStrictEqual({
          hello: 'world',
        });
      });
    });

    describe('when a response validator is configured', () => {
      it('should validate responses with the given validator', async () => {
        const testEndpoint = new Endpoint({
          addr,
          method: 'POST',
          path: '/validator-config-test',
        }).config({ respValidator: () => ({ valid: true }) });
        client
          .intercept({
            path: '/validator-config-test',
            method: 'POST',
          })
          .reply(
            404,
            {
              error: 'some-error',
            },
            testResponseOptions,
          );
        const { resp } = await testEndpoint.call({});
        expect(resp.body).toStrictEqual({ error: 'some-error' });
        expect(resp.statusCode).toBe(404);
      });
      it('should validate responses with a given custom error message', async () => {
        const testEndpoint = new Endpoint({
          addr,
          method: 'POST',
          path: '/error-config-test',
        }).config({
          respValidator: (resp) => {
            if (resp.statusCode === 404) return { valid: false, msg: 'Failed to retrieve users.' };
            if (!Object.keys(resp.body as Record<string, unknown>).includes('id'))
              return { valid: false, msg: 'Response did not provide user ID.' };
            return { valid: true };
          },
        });
        client
          .intercept({
            path: '/error-config-test',
            method: 'POST',
          })
          .reply(
            404,
            {
              error: 'some-error',
            },
            testResponseOptions,
          );
        await expect(testEndpoint.call({})).rejects.toThrow({
          name: 'InvalidResponseError',
          message: 'Response is invalid: Failed to retrieve users.',
        });

        client
          .intercept({
            path: '/error-config-test',
            method: 'POST',
          })
          .reply(
            200,
            {
              name: 'Dude',
            },
            testResponseOptions,
          );
        await expect(testEndpoint.call({})).rejects.toThrow({
          name: 'InvalidResponseError',
          message: 'Response is invalid: Response did not provide user ID.',
        });
      });
    });
  });

  describe('when a response is received for an endpoint call', () => {
    it('should contain standard HTTP response information', async () => {
      const testEndpoint = new Endpoint({ addr, method: 'POST', path: '/response-test' });
      client
        .intercept({
          path: '/response-test',
          method: 'POST',
        })
        .reply(200);

      const { resp } = await testEndpoint.call({});
      expect(
        ['statusCode', 'headers', 'body', 'trailers', 'opaque', 'context'].sort(),
      ).toStrictEqual(Object.keys(resp).sort());
    });
  });

  describe('when a request payload is assigned to an endpoint', () => {
    const userPath = uniquePath('/user');
    const testEndpoint = new Endpoint({ addr, method: 'POST', path: userPath }).body(
      testReqPayload,
    );
    const respEndpoint = new Endpoint({ addr, method: 'GET', path: '/age' });
    const respPayload = {
      age: 10,
    };
    const responses = {
      [respEndpoint.id]: [respPayload],
    };

    it('should expose its input nodes for setting up links', () => {
      testEndpoint.set((nodes) => {
        expect(Object.keys(nodes.body)).toStrictEqual(Object.keys(testReqPayload));
      });
    });

    it('should use the default value if no SourceNode is linked', async () => {
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(200);
      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();
      await testEndpoint.call(responses);

      expect(tracker).toHaveBeenCalledTimes(1);
      const call = tracker.mock.calls[0];

      expect(call?.[0]?.body).toStrictEqual(testReqPayload);
    });

    it('should use the available response value after a SourceNode is linked to the InputNode', async () => {
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(200);
      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();

      testEndpoint.set((nodes) => {
        link(nodes.body.details.age, respEndpoint.resp.age);
      });
      await testEndpoint.call(responses);

      const call = tracker.mock.calls[0];
      expect(call?.[0]?.body).toStrictEqual({
        id: 'some-id',
        name: 'some-name',
        details: {
          age: 10,
          member: true,
        },
      });
    });

    it('should use values from a provided generator function', async () => {
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(200);
      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();
      const testValGen = () => 'michael-scott';

      const testReqPayloadWithValGen = {
        id: 'some-id',
        name: gen(testValGen),
        details: {
          age: 42,
          member: true,
        },
      };
      testEndpoint.body(testReqPayloadWithValGen);
      await testEndpoint.call(responses);

      const call = tracker.mock.calls[0];
      const callBody = call?.[0]?.body;
      expect(callBody).toStrictEqual({
        id: 'some-id',
        name: 'michael-scott',
        details: {
          age: 42,
          member: true,
        },
      });
    });
  });

  describe('#pathParams', () => {
    describe('when a path has one param', () => {
      const testEndpoint = new Endpoint({ addr, path: '/pet/{petId}', method: 'get' });

      it('should expose its path params for setting up links', () => {
        testEndpoint.set((nodes) => {
          expect(Object.keys(nodes.pathParams)).toStrictEqual(['petId']);
        });
      });

      it('should throw an error when called without values for path params', async () => {
        client
          .intercept({
            path: '/pet',
            method: 'GET',
          })
          .reply(200);
        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        await expect(testEndpoint.call({})).rejects.toThrow(RequiredValuesNotFoundError);
        expect(tracker).toHaveBeenCalledTimes(0);
      });
    });

    describe('when the path has multiple params', () => {
      const testEndpoint = new Endpoint({
        addr,
        path: '/user/{userId}/pet/{petId}/1',
        method: 'get',
      });

      it('should expose its path params for setting up links', () => {
        testEndpoint.set((nodes) => {
          expect(Object.keys(nodes.pathParams)).toStrictEqual(['userId', 'petId']);
        });
      });

      it('should throw an error when called without values for path params', async () => {
        client
          .intercept({
            path: '/user',
            method: 'GET',
          })
          .reply(200);
        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        await expect(testEndpoint.call({})).rejects.toThrow(RequiredValuesNotFoundError);
        expect(tracker).toHaveBeenCalledTimes(0);
      });
    });

    describe('when the endpoint calls the pathParams method with default values', () => {
      const testEndpoint = new Endpoint({
        addr,
        path: '/user/{userId}/pet/{petId}/2',
        method: 'get',
      });

      testEndpoint.pathParams({
        userId: 'user123',
        petId: 'pet123',
        irrelevantKey: 'irrelevant-value',
      });

      it('should place only the relevant values in the path params', async () => {
        client
          .intercept({
            path: '/user/user123/pet/pet123/2',
            method: 'GET',
          })
          .reply(200);
        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        await testEndpoint.call({});
        expect(tracker.mock.calls[0][0].path).toBe('/user/user123/pet/pet123/2');
      });
    });

    describe('when the endpoint calls the pathParams method with links', () => {
      const loginPath = uniquePath('/login');
      const petPath = uniquePath('/pet');
      const login = new Endpoint({
        addr,
        path: loginPath,
        method: 'post',
      });
      const getPet = new Endpoint({
        addr,
        path: petPath,
        method: 'post',
      });
      const testEndpoint = new Endpoint({
        addr,
        path: '/user/{userId}/pet/{petId}/3',
        method: 'get',
      });

      testEndpoint.pathParams({
        userId: link(login.resp.body.id, (id: string) => `user-${id}`),
        petId: linkMerge(
          [login.resp.body.id, getPet.resp.body.id],
          ([userId, petId]: [string, string]) => `user-${userId}-pet-${petId}`,
        ),
        irrelevantKey: 'irrelevant-value',
      });

      it('should throw an error when called without values for path params', async () => {
        client
          .intercept({
            path: '/user/user-100/pet/user-100-pet-222/3',
            method: 'GET',
          })
          .reply(200);
        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        await testEndpoint.call({
          [login.id]: [{ body: { id: '100' } }],
          [getPet.id]: [{ body: { id: '222' } }],
        });
        expect(tracker.mock.calls[0][0].path).toBe('/user/user-100/pet/user-100-pet-222/3');
      });
    });
  });

  describe('when query params are assigned to an endpoint', () => {
    const testQuery = {
      cute: true,
    };
    const testEndpoint = new Endpoint({ addr, path: '/pet', method: 'get' });
    testEndpoint.query(testQuery);

    it('should expose its path params for setting up links', () => {
      testEndpoint.set((nodes) => {
        expect(Object.keys(nodes.query)).toStrictEqual(['cute']);
      });
    });

    it('should call the endpoint with the given query params', async () => {
      client
        .intercept({
          path: '/pet?cute=true',
          method: 'GET',
        })
        .reply(200);
      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();

      await testEndpoint.call({});
      expect(tracker).toHaveBeenCalledTimes(1);
    });
  });

  describe('when multiple query params are assigned to an endpoint', () => {
    const testQuery = {
      cute: true,
      iq: 200,
    };
    const testEndpoint = new Endpoint({ addr, path: '/pet', method: 'get' });
    testEndpoint.query(testQuery);

    it('should expose its path params for setting up links', () => {
      testEndpoint.set((nodes) => {
        expect(Object.keys(nodes.query)).toStrictEqual(['cute', 'iq']);
      });
    });

    it('should call the endpoint with the given query params', async () => {
      client
        .intercept({
          path: '/pet?cute=true&iq=200',
          method: 'GET',
        })
        .reply(200);
      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();

      await testEndpoint.call({});
      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][0]?.path).toStrictEqual('/pet?cute=true&iq=200');
    });
  });

  describe('when custom headers are assigned to an endpoint', () => {
    const testHeaders = {
      token: 'some-token',
      'content-type': 'application/nonsense',
    };
    const testEndpoint = new Endpoint({ addr, path: '/auth', method: 'get' });
    testEndpoint.headers(testHeaders);

    it('should expose its headers for setting up links', () => {
      testEndpoint.set((nodes) => {
        expect(Object.keys(nodes.headers)).toStrictEqual(['token', 'content-type']);
      });
    });

    it('should call the endpoint with the given headers and override conflicting defaults', async () => {
      client
        .intercept({
          path: '/auth',
          method: 'GET',
        })
        .reply(200);

      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();

      await testEndpoint.call({});
      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][0]?.headers).toStrictEqual({
        token: 'some-token',
        'content-type': 'application/nonsense',
      });
    });
  });

  describe('when provided call opts do not cover all the required values', () => {
    const userPath = uniquePath('/user');
    const testEndpoint = new Endpoint({ addr, path: userPath, method: 'post' }).body({
      details: {
        age: required(),
        name: required(),
      },
    });
    it('should throw an error indicating required values are not found', async () => {
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(200);

      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();

      await expect(
        testEndpoint.call(
          {},
          {
            body: {
              details: {
                name: 'dude',
              },
            },
          },
        ),
      ).rejects.toThrow(RequiredValuesNotFoundError);
    });
  });
});
