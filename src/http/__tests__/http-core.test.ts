/** Integration Tests for chainflow core and http */
import { chainflow, seed, store } from '../../core/chainflow';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { link, linkMerge } from '../../core/utils/link';
import { config } from '../../core/utils/config';
import { origin } from '../origin';
import { required } from '../../core/utils/initializers';
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

/** @todo Slim down these unit tests based on what is already tested in core */

describe('#http-core', () => {
  const baseUrl = 'http://127.0.0.1:5000';
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get(baseUrl);
  const testOrigin = origin('127.0.0.1:5000');

  it('should allow API calls', async () => {
    const userPath = uniquePath('/user');
    const endpoint = testOrigin.get(userPath);
    const tracker = jest.spyOn(endpoint, 'call');
    tracker.mockClear();
    client
      .intercept({
        path: userPath,
        method: 'GET',
      })
      .reply(200);

    await chainflow().call(endpoint).run();
    expect(tracker).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple API calls', async () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    const getUser = testOrigin.get(userPath);
    const createRole = testOrigin.post(rolePath);

    client
      .intercept({
        path: userPath,
        method: 'GET',
      })
      .reply(200)
      .times(2);
    client
      .intercept({
        path: rolePath,
        method: 'POST',
      })
      .reply(200);

    const userTracker = jest.spyOn(getUser, 'call');
    const roleTracker = jest.spyOn(createRole, 'call');
    userTracker.mockClear();
    roleTracker.mockClear();

    await chainflow().call(getUser).call(createRole).call(getUser).run();

    expect(userTracker).toHaveBeenCalledTimes(2);
    expect(roleTracker).toHaveBeenCalledTimes(1);
  });

  describe('when an endpoint call returns an error code', () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    const getUser = testOrigin.get(userPath);
    const createRole = testOrigin.post(rolePath);

    const userTracker = jest.spyOn(getUser, 'call');
    const roleTracker = jest.spyOn(createRole, 'call');

    it('should break the chainflow', async () => {
      userTracker.mockClear();
      roleTracker.mockClear();
      client
        .intercept({
          path: userPath,
          method: 'GET',
        })
        .reply(200)
        .times(2);
      client
        .intercept({
          path: rolePath,
          method: 'POST',
        })
        .reply(400);
      await expect(
        chainflow().call(getUser).call(createRole).call(getUser).run(),
      ).rejects.toThrow();

      expect(userTracker).toHaveBeenCalledTimes(1);
      expect(roleTracker).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a chainflow has finished a run', () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    const createUser = testOrigin.post(userPath).body({
      name: 'Tom',
    });
    const createRole = testOrigin.post(rolePath).body({
      userId: 'defaultId',
    });

    const testFlow = chainflow().call(createUser).call(createRole);
    const tracker = jest.spyOn(createRole, 'call');

    it('should reset its state so future runs use a clean slate', async () => {
      tracker.mockClear();
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(
          200,
          {
            userId: 'userId A',
          },
          testResponseOptions,
        );
      client
        .intercept({
          path: rolePath,
          method: 'POST',
        })
        .reply(200);
      await testFlow.run();

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][0][createUser.id][0].body).toStrictEqual({
        userId: 'userId A',
      });
      tracker.mockClear();

      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(
          200,
          {
            userId: 'userId B',
          },
          testResponseOptions,
        );

      client
        .intercept({
          path: rolePath,
          method: 'POST',
        })
        .reply(200);

      await testFlow.run();

      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][0][createUser.id][0].body).toStrictEqual({
        userId: 'userId B',
      });
    });
  });

  describe('when multiple possible sources are linked to an input node', () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    const createUser = testOrigin.post(userPath);
    const getUser = testOrigin.get(userPath);
    const createRole = testOrigin.post(rolePath).body({
      name: 'defaultName',
      roleName: 'someRole',
    });

    createRole.set(({ body: { name } }) => {
      link(name, createUser.resp.body.details.name);
      link(name, getUser.resp.body.details.name);
    });
    const testFlow = chainflow().call(createUser).call(getUser).call(createRole);
    const tracker = jest.spyOn(httpClient, 'request');

    describe('when both linked responses have the source value', () => {
      it('should use the value of the response with higher priority', async () => {
        tracker.mockClear();
        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(
            200,
            {
              details: {
                name: 'A',
              },
            },
            testResponseOptions,
          );
        client
          .intercept({
            path: userPath,
            method: 'GET',
          })
          .reply(
            200,
            {
              details: {
                name: 'B',
              },
            },
            testResponseOptions,
          );
        client
          .intercept({
            path: rolePath,
            method: 'POST',
          })
          .reply(200);

        await testFlow.run();
        expect(tracker).toHaveBeenCalledTimes(3);
        const roleCall = tracker.mock.calls[2];
        const callBody = roleCall?.[0]?.body;
        expect(callBody).toStrictEqual({
          name: 'A',
          roleName: 'someRole',
        });
      });
    });

    describe('when the first available linked response does not have value', () => {
      it('should use value from another linked response ', async () => {
        tracker.mockClear();
        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(
            200,
            {
              details: null,
            },
            testResponseOptions,
          );

        client
          .intercept({
            path: userPath,
            method: 'GET',
          })
          .reply(
            200,
            {
              details: {
                name: 'B',
              },
            },
            testResponseOptions,
          );
        client
          .intercept({
            path: rolePath,
            method: 'POST',
          })
          .reply(200);

        await testFlow.run();
        expect(tracker).toHaveBeenCalledTimes(3);
        const roleCall = tracker.mock.calls[2];
        const callBody = roleCall?.[0]?.body;
        expect(callBody).toStrictEqual({
          name: 'B',
          roleName: 'someRole',
        });
      });

      describe('when undefined values are allowed from the linked response', () => {
        const createRole = testOrigin.post(rolePath).body({
          name: 'defaultName',
          roleName: 'someRole',
        });
        createRole.set(({ body: { name } }) => {
          link(name, config(createUser.resp.body.details.name, { allowUndefined: true }));
          link(name, getUser.resp.body.details.name);
        });
        const testFlow = chainflow().call(createUser).call(getUser).call(createRole);
        const tracker = jest.spyOn(httpClient, 'request');

        it('should use undefined instead of accessing the next linked response ', async () => {
          tracker.mockClear();
          client
            .intercept({
              path: userPath,
              method: 'POST',
            })
            .reply(
              200,
              {
                details: null,
              },
              testResponseOptions,
            );

          client
            .intercept({
              path: userPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                details: {
                  name: 'B',
                },
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: rolePath,
              method: 'POST',
            })
            .reply(200);

          await testFlow.run();
          expect(tracker).toHaveBeenCalledTimes(3);
          const roleCall = tracker.mock.calls[2];
          const callBody = roleCall?.[0]?.body;
          expect(callBody).toStrictEqual({
            name: undefined,
            roleName: 'someRole',
          });
        });
      });
    });
  });

  describe('when a callback is provided for a linked value', () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    const createUser = testOrigin.post(userPath).body({
      name: 'Tom',
    });
    const createRole = testOrigin.post(rolePath).body({
      userId: 'defaultId',
    });

    const testCallback = (userId: string) => `${userId} has been modified`;
    createRole.set(({ body: { userId } }) => {
      link(userId, createUser.resp.body.userId, testCallback);
    });
    const tracker = jest.spyOn(httpClient, 'request');

    it('should call the endpoint with the given query params', async () => {
      tracker.mockClear();
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(
          200,
          {
            userId: 'newUserId',
          },
          testResponseOptions,
        );
      client
        .intercept({
          path: rolePath,
          method: 'POST',
        })
        .reply(200);

      await chainflow().call(createUser).call(createRole).run();

      expect(tracker).toHaveBeenCalledTimes(2);
      const roleCall = tracker.mock.calls[1];
      const roleCallBody = roleCall[0]?.body;
      expect(roleCallBody).toStrictEqual({
        userId: 'newUserId has been modified',
      });
    });
  });

  describe('when multiple responses are linked to an input node and to be combined', () => {
    describe('when the sources are provided directly at input node creation', () => {
      describe('when an object with keys is provided as sources', () => {
        const userPath = uniquePath('/user');
        const favAnimalPath = uniquePath('/favAnimal');
        const notificationPath = uniquePath('/notification');

        const testCallback = ({ userName, favAnimal }: { userName: string; favAnimal: string }) =>
          `${userName} likes ${favAnimal}.`;
        const getUser = testOrigin.get(userPath);
        const getFavAnimal = testOrigin.get(favAnimalPath);
        const createNotification = testOrigin.post(notificationPath).body({
          msg: linkMerge(
            {
              userName: getUser.resp.body.name,
              favAnimal: getFavAnimal.resp.body.favAnimal,
            },
            testCallback,
          ),
        });

        const tracker = jest.spyOn(httpClient, 'request');

        it('should pass both linked responses to the request', async () => {
          tracker.mockClear();
          client
            .intercept({
              path: userPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                name: 'John',
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: favAnimalPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                favAnimal: 'dogs',
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: notificationPath,
              method: 'POST',
            })
            .reply(200);
          await chainflow().call(getUser).call(getFavAnimal).call(createNotification).run();

          expect(tracker).toHaveBeenCalledTimes(3);
          const notificationCall = tracker.mock.calls[2];
          const notificationCallBody = notificationCall[0]?.body;
          expect(notificationCallBody).toStrictEqual({
            msg: 'John likes dogs.',
          });
        });
      });

      describe('when an array of sources is provided', () => {
        const userPath = uniquePath('/user');
        const favAnimalPath = uniquePath('/favAnimal');
        const notificationPath = uniquePath('/notification');

        const testCallback = ([name, favAnimal]: [string, string]) => `${name} likes ${favAnimal}.`;

        const getUser = testOrigin.get(userPath);
        const getFavAnimal = testOrigin.get(favAnimalPath);
        const createNotification = testOrigin.post(notificationPath).body({
          msg: linkMerge([getUser.resp.body.name, getFavAnimal.resp.body.favAnimal], testCallback),
        });

        const tracker = jest.spyOn(httpClient, 'request');

        it('should pass both linked responses to the request', async () => {
          tracker.mockClear();
          client
            .intercept({
              path: userPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                name: 'John',
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: favAnimalPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                favAnimal: 'dogs',
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: notificationPath,
              method: 'POST',
            })
            .reply(200);
          await chainflow().call(getUser).call(getFavAnimal).call(createNotification).run();

          expect(tracker).toHaveBeenCalledTimes(3);
          const notificationCall = tracker.mock.calls[2];
          const notificationCallBody = notificationCall[0]?.body;
          expect(notificationCallBody).toStrictEqual({
            msg: 'John likes dogs.',
          });
        });
      });
    });

    describe('when using the set method', () => {
      describe('when an object with keys is provided as sources', () => {
        const userPath = uniquePath('/user');
        const favAnimalPath = uniquePath('/favAnimal');
        const notificationPath = uniquePath('/notification');

        const getUser = testOrigin.get(userPath);
        const getFavAnimal = testOrigin.get(favAnimalPath);
        const createNotification = testOrigin.post(notificationPath).body({
          msg: 'default msg',
        });

        const testCallback = ({ userName, favAnimal }: { userName: string; favAnimal: string }) =>
          `${userName} likes ${favAnimal}.`;
        createNotification.set(({ body: { msg } }) => {
          linkMerge(
            msg,
            {
              userName: getUser.resp.body.name,
              favAnimal: getFavAnimal.resp.body.favAnimal,
            },
            testCallback,
          );
        });
        const tracker = jest.spyOn(httpClient, 'request');

        it('should pass both linked responses to the request', async () => {
          tracker.mockClear();
          client
            .intercept({
              path: userPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                name: 'John',
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: favAnimalPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                favAnimal: 'dogs',
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: notificationPath,
              method: 'POST',
            })
            .reply(200);
          await chainflow().call(getUser).call(getFavAnimal).call(createNotification).run();

          expect(tracker).toHaveBeenCalledTimes(3);
          const notificationCall = tracker.mock.calls[2];
          const notificationCallBody = notificationCall[0]?.body;
          expect(notificationCallBody).toStrictEqual({
            msg: 'John likes dogs.',
          });
        });
      });

      describe('when an array of sources is provided', () => {
        const userPath = uniquePath('/user');
        const favAnimalPath = uniquePath('/favAnimal');
        const notificationPath = uniquePath('/notification');

        const getUser = testOrigin.get(userPath);
        const getFavAnimal = testOrigin.get(favAnimalPath);
        const createNotification = testOrigin.post(notificationPath).body({
          msg: ['default msg'],
        });

        const testCallback = ([name, favAnimal]: [string, string]) => `${name} likes ${favAnimal}.`;
        createNotification.set(({ body: { msg } }) => {
          linkMerge(msg, [getUser.resp.body.name, getFavAnimal.resp.body.favAnimal], testCallback);
        });
        const tracker = jest.spyOn(httpClient, 'request');

        it('should pass both linked responses to the request', async () => {
          tracker.mockClear();
          client
            .intercept({
              path: userPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                name: 'John',
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: favAnimalPath,
              method: 'GET',
            })
            .reply(
              200,
              {
                favAnimal: 'dogs',
              },
              testResponseOptions,
            );
          client
            .intercept({
              path: notificationPath,
              method: 'POST',
            })
            .reply(200);
          await chainflow().call(getUser).call(getFavAnimal).call(createNotification).run();

          expect(tracker).toHaveBeenCalledTimes(3);
          const notificationCall = tracker.mock.calls[2];
          const notificationCallBody = notificationCall[0]?.body;
          expect(notificationCallBody).toStrictEqual({
            msg: 'John likes dogs.',
          });
        });
      });
    });
  });

  describe('when a value is marked as required', () => {
    const userPath = uniquePath('/user');
    const createUser = testOrigin.post(userPath).body({
      name: required(),
    });

    const tracker = jest.spyOn(httpClient, 'request');

    it('should throw a RequiredValueNotFoundError if value is not provided', async () => {
      tracker.mockClear();
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(200);
      await expect(chainflow().call(createUser).run()).rejects.toThrow(RequiredValuesNotFoundError);
    });

    it('should not throw an error if the value is provided', async () => {
      tracker.mockClear();
      const getRandName = testOrigin.get('/randName');
      createUser.set(({ body: { name } }) => {
        link(name, getRandName.resp.body.name);
      });

      client
        .intercept({
          path: '/randName',
          method: 'GET',
        })
        .reply(
          200,
          {
            name: 'Tom',
          },
          testResponseOptions,
        );
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(200);
      expect(chainflow().call(getRandName).call(createUser).run).rejects.not;
    });
  });

  describe('when call options are provided', () => {
    const addUser = testOrigin
      .post('/{groupId}/user')
      .body({
        name: 'default',
      })
      .query({
        role: 'default',
      })
      .headers({
        token: 'default',
      });

    const tracker = jest.spyOn(httpClient, 'request');

    it('should call the endpoint with the given call options', async () => {
      tracker.mockClear();
      client
        .intercept({
          path: '/someGroup/user',
          method: 'POST',
          query: {
            role: 'someRole',
          },
        })
        .reply(200);

      await chainflow()
        .call(addUser, {
          body: {
            name: 'some name',
          },
          pathParams: {
            groupId: 'someGroup',
          },
          query: {
            role: 'someRole',
          },
          headers: {
            token: 'some token',
          },
        })
        .run();
      expect(tracker).toHaveBeenCalledTimes(1);
      const arg = tracker.mock.calls[0][0];
      expect(arg?.body).toStrictEqual({
        name: 'some name',
      });
      expect(arg?.url).toBe(`${baseUrl}/someGroup/user?role=someRole`);
      expect(arg?.headers).toStrictEqual({
        token: 'some token',
      });
    });
  });

  describe('when run options are provided', () => {
    const userPath = uniquePath('/user');
    const createUser = testOrigin.post(userPath).body({
      name: 'default',
    });

    createUser.set(({ body: { name } }) => {
      link(name, seed.username);
    });

    const tracker = jest.spyOn(httpClient, 'request');

    it('should call the endpoint with the given seed', async () => {
      tracker.mockClear();
      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(200);

      await chainflow().call(createUser).seed({ username: 'some name' }).run();
      expect(tracker).toHaveBeenCalledTimes(1);
      const arg = tracker.mock.calls[0][0];
      expect(arg?.body).toStrictEqual({
        name: 'some name',
      });
    });
  });

  describe('when a source node is provided directly to input nodes', () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    it('should take the value from the specified source', async () => {
      const createUser = testOrigin.post(userPath).body({
        name: 'Tom',
      });

      const createRole = testOrigin.post(rolePath).body({
        userId: createUser.resp.body.id,
        type: 'ENGINEER',
      });

      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();

      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(
          200,
          {
            id: 'some-id',
          },
          testResponseOptions,
        );

      client
        .intercept({
          path: rolePath,
          method: 'POST',
        })
        .reply(200);

      await chainflow().call(createUser).call(createRole).run();

      expect(tracker).toHaveBeenCalledTimes(2);
      expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
        userId: 'some-id',
        type: 'ENGINEER',
      });
    });
  });

  describe('when a source node is provided directly to input nodes with callback', () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    it('should take the value from the specified source', async () => {
      const createUser = testOrigin.post(userPath).body({
        name: 'Tom',
      });

      const createRole = testOrigin.post(rolePath).body({
        name: link(createUser.resp.body.name, (name: string) => name.toUpperCase()),
        type: 'ENGINEER',
      });

      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();

      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(
          200,
          {
            name: 'Tom',
          },
          testResponseOptions,
        );

      client
        .intercept({
          path: rolePath,
          method: 'POST',
        })
        .reply(200);

      await chainflow().call(createUser).call(createRole).run();

      expect(tracker).toHaveBeenCalledTimes(2);
      expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
        name: 'TOM',
        type: 'ENGINEER',
      });
    });
  });

  describe('when a chainflow is cloned', () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    it('the cloned flow can be extended without changing the original', async () => {
      const createUser = testOrigin.post(userPath).body({
        name: seed.username,
      });
      const createRole = testOrigin.post(rolePath).body({
        id: createUser.resp.body.id,
        type: 'ENGINEER',
      });

      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();

      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(
          200,
          {
            id: 123,
          },
          testResponseOptions,
        )
        .times(3);
      client
        .intercept({
          path: rolePath,
          method: 'POST',
        })
        .reply(200);

      const flow1 = chainflow().call(createUser).seed({ username: 'Tom' });
      await flow1.run();
      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][0].body).toStrictEqual({
        name: 'Tom',
      });

      tracker.mockClear();
      const flow2 = flow1.clone().call(createRole).seed({ username: 'Jane' });
      await flow2.run();
      expect(tracker).toHaveBeenCalledTimes(2);
      expect(tracker.mock.calls[0][0].body).toStrictEqual({
        name: 'Jane',
      });

      // check flow1's callqueue and init source values are not changed
      tracker.mockClear();
      await flow1.run();
      expect(tracker).toHaveBeenCalledTimes(1);
      expect(tracker.mock.calls[0][0].body).toStrictEqual({
        name: 'Tom',
      });
    });
  });

  describe('when a chainflow is extended', () => {
    const userPath = uniquePath('/user');
    const rolePath = uniquePath('/role');
    it('the original flow should append the callqueue of the extending flow', async () => {
      const createUser = testOrigin.post(userPath).body({
        name: 'Tom',
      });

      const createRole = testOrigin.post(rolePath).body({
        name: createUser.resp.body.name,
        type: 'ENGINEER',
      });

      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();
      const flow1 = chainflow().call(createUser);
      const flow2 = chainflow().call(createRole);

      client
        .intercept({
          path: userPath,
          method: 'POST',
        })
        .reply(
          200,
          {
            name: 'Tom',
          },
          testResponseOptions,
        );
      client
        .intercept({
          path: rolePath,
          method: 'POST',
        })
        .reply(200);

      await flow1.extend(flow2).run();
      expect(tracker).toHaveBeenCalledTimes(2);
    });
  });

  describe('when a chainflow calls endpoints that use its store', () => {
    describe('when an endpoint defines a store value', () => {
      const userPath = uniquePath('/user');
      const rolePath = uniquePath('/role');

      it('should pass values through the store', async () => {
        const createUser = testOrigin
          .post(userPath)
          .body({
            name: 'Tom',
          })
          .store((resp) => ({
            username: resp.body.name,
          }));

        const createRole = testOrigin.post(rolePath).body({
          name: store.username,
          type: 'ENGINEER',
        });

        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(
            200,
            {
              name: 'Tom',
            },
            testResponseOptions,
          );
        client
          .intercept({
            path: rolePath,
            method: 'POST',
          })
          .reply(200);

        await chainflow().call(createUser).call(createRole).run();
        expect(tracker).toHaveBeenCalledTimes(2);
        expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
          name: 'Tom',
          type: 'ENGINEER',
        });
      });
    });

    describe('when an endpoint defines a deeply nested store value', () => {
      const userPath = uniquePath('/user');
      const rolePath = uniquePath('/role');
      it('should pass values through the store', async () => {
        const createUser = testOrigin
          .post(userPath)
          .body({
            name: 'Tom',
          })
          .store((resp) => ({
            user: {
              profile: {
                firstName: resp.body.name,
              },
            },
          }));

        const createRole = testOrigin.post(rolePath).body({
          name: store.user.profile.firstName,
          type: 'ENGINEER',
        });

        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(
            200,
            {
              name: 'Tom',
            },
            testResponseOptions,
          );
        client
          .intercept({
            path: rolePath,
            method: 'POST',
          })
          .reply(200);

        await chainflow().call(createUser).call(createRole).run();
        expect(tracker).toHaveBeenCalledTimes(2);
        expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
          name: 'Tom',
          type: 'ENGINEER',
        });
      });
    });

    describe('when multiple endpoints put values into the same store key', () => {
      const userPath = uniquePath('/user');
      const rolePath = uniquePath('/role');
      it('should have the later endpoint call override the store value put by the previous call', async () => {
        const createUser = testOrigin
          .post(userPath)
          .body({
            name: 'Tom',
          })
          .store((resp) => ({
            username: resp.body.name,
          }));
        const getUser = testOrigin.get(userPath).store((resp) => ({
          username: resp.body.name,
        }));

        const createRole = testOrigin.post(rolePath).body({
          name: store.username,
          type: 'ENGINEER',
        });

        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(
            200,
            {
              name: 'Tom',
            },
            testResponseOptions,
          );
        client
          .intercept({
            path: userPath,
            method: 'GET',
          })
          .reply(
            200,
            {
              name: 'Jane',
            },
            testResponseOptions,
          );
        client
          .intercept({
            path: rolePath,
            method: 'POST',
          })
          .reply(200);

        await chainflow().call(createUser).call(getUser).call(createRole).run();
        expect(tracker).toHaveBeenCalledTimes(3);
        expect(tracker.mock.calls[2][0]?.body).toStrictEqual({
          name: 'Jane',
          type: 'ENGINEER',
        });
      });
    });

    describe('when the storeDef instructs the entire response to be put the store', () => {
      const userPath = uniquePath('/user');
      const rolePath = uniquePath('/role');
      it('should allow the entire response object to be put in the store', async () => {
        const createUser = testOrigin
          .post(userPath)
          .body({
            name: 'Tom',
          })
          .store((resp) => ({
            createUserResponse: resp,
          }));

        const createRole = testOrigin.post(rolePath).body({
          name: store.createUserResponse.body.name,
          type: 'ENGINEER',
        });

        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(
            200,
            {
              name: 'Tom',
            },
            testResponseOptions,
          );
        client
          .intercept({
            path: rolePath,
            method: 'POST',
          })
          .reply(200);

        await chainflow().call(createUser).call(createRole).run();
        expect(tracker).toHaveBeenCalledTimes(2);
        expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
          name: 'Tom',
          type: 'ENGINEER',
        });
      });
    });

    describe('when value to be stored is undefined and undefined is not allowed', () => {
      const userPath = uniquePath('/user');
      const rolePath = uniquePath('/role');
      it('should not store the value', async () => {
        const createUser = testOrigin
          .post(userPath)
          .body({
            name: 'Tom',
          })
          .store((resp) => ({
            username: {
              firstName: resp.body.username.firstName,
            },
          }));

        const createRole = testOrigin.post(rolePath).body({
          name: 'default-name',
          type: 'ENGINEER',
        });

        createRole.set(({ body: { name } }) => {
          link(name, store.username.firstName);
        });

        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(200, { username: undefined }, testResponseOptions);
        client
          .intercept({
            path: rolePath,
            method: 'POST',
          })
          .reply(200);

        await chainflow().call(createUser).call(createRole).run();
        expect(tracker).toHaveBeenCalledTimes(2);
        expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
          name: 'default-name',
          type: 'ENGINEER',
        });
      });
    });

    describe('when value to be stored is undefined and undefined is allowed', () => {
      const userPath = uniquePath('/user');
      const rolePath = uniquePath('/role');
      it('should not store the value', async () => {
        const createUser = testOrigin
          .post(userPath)
          .body({
            name: 'Tom',
          })
          .store((resp) => ({
            username: {
              firstName: resp.body.username.firstName,
            },
          }));

        const createRole = testOrigin.post(rolePath).body({
          name: 'default-name',
          type: 'ENGINEER',
        });

        createRole.set(({ body: { name } }) => {
          link(name, config(store.username.firstName, { allowUndefined: true }));
        });

        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(200, { username: undefined }, testResponseOptions);
        client
          .intercept({
            path: rolePath,
            method: 'POST',
          })
          .reply(200);

        await chainflow().call(createUser).call(createRole).run();
        expect(tracker).toHaveBeenCalledTimes(2);
        expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
          name: undefined,
          type: 'ENGINEER',
        });
      });
    });

    describe('when chainflow runs with save as true', () => {
      const loginPath = uniquePath('/login');
      const userPath = uniquePath('/user');
      it('should keep the stored value', async () => {
        const login = testOrigin.post(loginPath).body({
          name: 'admin',
        });

        const addUser = testOrigin.post(userPath).body({
          id: login.resp.body.id,
          username: seed.username,
        });

        const tracker = jest.spyOn(httpClient, 'request');
        tracker.mockClear();

        client
          .intercept({
            path: loginPath,
            method: 'POST',
          })
          .reply(200, { id: 'admin-id' }, testResponseOptions);
        client
          .intercept({
            path: userPath,
            method: 'POST',
          })
          .reply(200)
          .times(3);

        const loggedInFlow = await chainflow().call(login).run();
        const addUserFlow = chainflow().call(addUser).continuesFrom(loggedInFlow);

        const usernames = ['tom', 'dude', 'jane'];
        for (const username of usernames) {
          await addUserFlow.seed({ username }).run();
        }

        expect(tracker).toHaveBeenCalledTimes(4);
        usernames.forEach((username, i) => {
          expect(tracker.mock.calls[i + 1][0]?.body).toStrictEqual({
            id: 'admin-id',
            username,
          });
        });
      });
    });
  });

  describe('when origin base headers are defined with links', () => {
    const loginPath = uniquePath('/login');
    const userPath = uniquePath('/user');
    const testOrigin = origin('127.0.0.1:5000');
    const testLogin = testOrigin.post(loginPath);
    testOrigin.headers({
      Authorization: testLogin.resp.body.token,
    });
    const testEndpoint = testOrigin.get(userPath);

    it('should merge headers with endpoint headers overriding conflicting origin headers', async () => {
      client
        .intercept({
          path: loginPath,
          method: 'post',
        })
        .reply(
          200,
          {
            token: 'some-token',
          },
          testResponseOptions,
        );
      client
        .intercept({
          path: userPath,
          method: 'get',
        })
        .reply(200);

      const tracker = jest.spyOn(httpClient, 'request');
      tracker.mockClear();
      await chainflow().call(testLogin).call(testEndpoint).run();

      expect(tracker).toHaveBeenCalledTimes(2);
      expect(tracker.mock.calls[1][0].headers).toStrictEqual(
        expect.objectContaining({
          Authorization: 'some-token',
        }),
      );
    });
  });
});
