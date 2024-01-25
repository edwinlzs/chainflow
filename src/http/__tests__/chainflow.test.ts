import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { chainflow, seed } from '../chainflow';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { allowUndefined, link, linkMany } from '../../core/utils/link';
import http from '../utils/client';
import { endpointFactory } from '../endpointFactory';
import { required } from '../../core/utils/initializers';
import { source, sources } from '../../core/utils/source';

describe('#chainflow', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1:5000');
  const factory = endpointFactory('127.0.0.1:5000');

  // used to maintain URL paths uniqueness to avoid one test's calls
  // from being picked up by another test's interceptor
  let deconflictor = 0;
  beforeEach(() => {
    deconflictor += 1;
  });

  it('should allow API calls', async () => {
    const endpoint = factory.get('/user');
    const tracker = mock.method(endpoint, 'call', () => ({}));

    await chainflow().call(endpoint).run();
    assert.equal(tracker.mock.callCount(), 1);
  });

  it('should allow multiple API calls', async () => {
    const getUser = factory.get('/user');
    const createRole = factory.post('/role');

    const userTracker = mock.method(getUser, 'call', () => ({}));
    const roleTracker = mock.method(createRole, 'call', () => ({}));

    await chainflow().call(getUser).call(createRole).call(getUser).run();

    assert.equal(userTracker.mock.callCount(), 2);
    assert.equal(roleTracker.mock.callCount(), 1);
  });

  describe('when an endpoint call returns an error code', () => {
    const getUser = factory.get('/user');
    const createRole = factory.post('/role');

    const userTracker = mock.method(getUser, 'call');
    const roleTracker = mock.method(createRole, 'call');

    it('should break the chainflow', async () => {
      client
        .intercept({
          path: '/user',
          method: 'GET',
        })
        .reply(200, {});
      client
        .intercept({
          path: '/role',
          method: 'POST',
        })
        .reply(400, {});
      await chainflow().call(getUser).call(createRole).call(getUser).run();

      assert.equal(userTracker.mock.callCount(), 1);
      assert.equal(roleTracker.mock.callCount(), 1);
    });
  });

  describe('when a chainflow has finished a run', () => {
    const createUser = factory.post('/user').body({
      name: 'Tom',
    });
    const createRole = factory.post('/role').body({
      userId: 'defaultId',
    });

    const testFlow = chainflow().call(createUser).call(createRole);
    const roleTracker = mock.method(createRole, 'call');

    it('should reset its state so future runs use a clean slate', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {
          userId: 'userId A',
        });
      roleTracker.mock.resetCalls();
      await testFlow.run();

      assert.equal(roleTracker.mock.callCount(), 1);
      assert.deepEqual(roleTracker.mock.calls[0].arguments[0], {
        [createUser.getHash()]: [
          {
            userId: 'userId A',
          },
        ],
      });

      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {
          userId: 'userId B',
        });

      roleTracker.mock.resetCalls();
      await testFlow.run();

      assert.equal(roleTracker.mock.callCount(), 1);
      assert.deepEqual(roleTracker.mock.calls[0].arguments[0], {
        [createUser.getHash()]: [
          {
            userId: 'userId B',
          },
        ],
      });
    });
  });

  describe('when multiple responses are linked to a request', () => {
    const createUser = factory.post('/user');
    const getUser = factory.get('/user');
    const createRole = factory.post('/role').body({
      name: 'defaultName',
      roleName: 'someRole',
    });

    createRole.set(({ body: { name } }) => {
      link(name, createUser.resp.details.name);
      link(name, getUser.resp.details.name);
    });
    const testFlow = chainflow().call(createUser).call(getUser).call(createRole);
    const tracker = mock.method(http, 'httpReq');

    describe('when both linked responses have the source value', () => {
      it('should use the value of the response with higher priority', async () => {
        client
          .intercept({
            path: '/user',
            method: 'POST',
          })
          .reply(200, {
            details: {
              name: 'A',
            },
          });

        client
          .intercept({
            path: '/user',
            method: 'GET',
          })
          .reply(200, {
            details: {
              name: 'B',
            },
          });
        tracker.mock.resetCalls();
        await testFlow.run();
        assert.equal(tracker.mock.callCount(), 3);
        const roleCall = tracker.mock.calls[2];
        const callBody = JSON.parse(roleCall.arguments?.[0]?.body);
        assert.deepEqual(callBody, {
          name: 'A',
          roleName: 'someRole',
        });
      });
    });

    describe('when the first available linked response does not have value', () => {
      it('should use value from another linked response ', async () => {
        client
          .intercept({
            path: '/user',
            method: 'POST',
          })
          .reply(200, {
            details: null,
          });

        client
          .intercept({
            path: '/user',
            method: 'GET',
          })
          .reply(200, {
            details: {
              name: 'B',
            },
          });
        tracker.mock.resetCalls();
        await testFlow.run();
        assert.equal(tracker.mock.callCount(), 3);
        const roleCall = tracker.mock.calls[2];
        const callBody = JSON.parse(roleCall.arguments?.[0]?.body);
        assert.deepEqual(callBody, {
          name: 'B',
          roleName: 'someRole',
        });
        tracker.mock.resetCalls();
      });

      describe('when undefined values are allowed from the linked response', () => {
        const createRole = factory.post('/role').body({
          name: 'defaultName',
          roleName: 'someRole',
        });
        createRole.set(({ body: { name } }) => {
          link(name, allowUndefined(createUser.resp.details.name));
          link(name, getUser.resp.details.name);
        });
        const testFlow = chainflow().call(createUser).call(getUser).call(createRole);
        const tracker = mock.method(http, 'httpReq');

        it('should use undefined instead of accessing the next linked response ', async () => {
          client
            .intercept({
              path: '/user',
              method: 'POST',
            })
            .reply(200, {
              details: null,
            });

          client
            .intercept({
              path: '/user',
              method: 'GET',
            })
            .reply(200, {
              details: {
                name: 'B',
              },
            });
          tracker.mock.resetCalls();
          await testFlow.run();
          assert.equal(tracker.mock.callCount(), 3);
          const roleCall = tracker.mock.calls[2];
          const callBody = JSON.parse(roleCall.arguments?.[0]?.body);
          assert.deepEqual(callBody, {
            roleName: 'someRole',
          });
          tracker.mock.resetCalls();
        });
      });
    });
  });

  describe('when a callback is provided for a linked value', () => {
    const createUser = factory.post('/user').body({
      name: 'Tom',
    });
    const createRole = factory.post('/role').body({
      userId: 'defaultId',
    });

    const testCallback = (userId: string) => `${userId} has been modified`;
    createRole.set(({ body: { userId } }) => {
      link(userId, createUser.resp.userId, testCallback);
    });
    const tracker = mock.method(http, 'httpReq');

    it('should call the endpoint with the given query params', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {
          userId: 'newUserId',
        });
      tracker.mock.resetCalls();
      await chainflow().call(createUser).call(createRole).run();

      assert.equal(tracker.mock.callCount(), 2);
      const roleCall = tracker.mock.calls[1];
      const roleCallBody = JSON.parse(roleCall?.arguments[0]?.body);
      assert.deepEqual(roleCallBody, {
        userId: 'newUserId has been modified',
      });
    });
  });

  describe('when multiple responses are linked to a request', () => {
    const getUser = factory.get('/user');
    const getFavAnimal = factory.get('/favAnimal');
    const createNotification = factory.post('/notification').body({
      msg: 'default msg',
    });

    const testCallback = ({ userName, favAnimal }: { userName: string; favAnimal: string }) =>
      `${userName} likes ${favAnimal}.`;
    createNotification.set(({ body: { msg } }) => {
      linkMany(
        msg,
        {
          userName: getUser.resp.name,
          favAnimal: getFavAnimal.resp.favAnimal,
        },
        testCallback,
      );
    });
    const tracker = mock.method(http, 'httpReq');

    it('should pass both linked responses to the request', async () => {
      client
        .intercept({
          path: '/user',
          method: 'GET',
        })
        .reply(200, {
          name: 'John',
        });
      client
        .intercept({
          path: '/favAnimal',
          method: 'GET',
        })
        .reply(200, {
          favAnimal: 'dogs',
        });
      tracker.mock.resetCalls();
      await chainflow().call(getUser).call(getFavAnimal).call(createNotification).run();

      assert.equal(tracker.mock.callCount(), 3);
      const notificationCall = tracker.mock.calls[2];
      const notificationCallBody = JSON.parse(notificationCall?.arguments[0]?.body);
      assert.deepEqual(notificationCallBody, {
        msg: 'John likes dogs.',
      });
    });
  });

  describe('when a value is marked as required', () => {
    const createUser = factory.post('/user').body({
      name: required(),
    });

    const tracker = mock.method(http, 'httpReq');

    it('should throw a RequiredValueNotFoundError if value is not provided', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});
      tracker.mock.resetCalls();
      assert.rejects(chainflow().call(createUser).run, 'RequiredValueNotFoundError');
    });

    it('should not throw an error if the value is provided', async () => {
      const getRandName = factory.get('/randName');
      createUser.set(({ body: { name } }) => {
        link(name, getRandName.resp.name);
      });

      client
        .intercept({
          path: '/randName',
          method: 'GET',
        })
        .reply(200, {
          name: 'Tom',
        });
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});
      tracker.mock.resetCalls();
      await assert.doesNotReject(chainflow().call(getRandName).call(createUser).run());
    });
  });

  describe('when call options are provided', () => {
    const addUser = factory
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

    const tracker = mock.method(http, 'httpReq');

    it('should call the endpoint with the given call options', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});
      tracker.mock.resetCalls();

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
      assert.equal(tracker.mock.callCount(), 1);
      const arg = tracker.mock.calls[0].arguments[0];
      assert.deepEqual(JSON.parse(arg?.body), {
        name: 'some name',
      });
      assert.equal(arg?.path, '/someGroup/user?role=someRole');
      assert.deepEqual(arg?.headers, {
        token: 'some token',
      });
    });
  });

  describe('when run options are provided', () => {
    const createUser = factory.post('/user').body({
      name: 'default',
    });

    createUser.set(({ body: { name } }) => {
      link(name, seed.username);
    });

    const tracker = mock.method(http, 'httpReq');

    it('should call the endpoint with the given seed', async () => {
      client
        .intercept({
          path: '/user',
          method: 'POST',
        })
        .reply(200, {});
      tracker.mock.resetCalls();

      await chainflow()
        .call(createUser)
        .run({
          seed: { username: 'some name' },
        });
      assert.equal(tracker.mock.callCount(), 1);
      const arg = tracker.mock.calls[0].arguments[0];
      assert.deepEqual(JSON.parse(arg?.body), {
        name: 'some name',
      });
    });
  });

  describe('when a source node is provided directly to input nodes', () => {
    it('should take the value from the specified source', async () => {
      const createUser = factory.post(`/user-${deconflictor}`).body({
        name: 'Tom',
      });

      const createRole = factory.post(`/role-${deconflictor}`).body({
        userId: createUser.resp.id,
        type: 'ENGINEER',
      });

      const tracker = mock.method(http, 'httpReq');

      client
        .intercept({
          path: `/user-${deconflictor}`,
          method: 'POST',
        })
        .reply(200, {
          id: 'some-id',
        });

      client
        .intercept({
          path: `/role-${deconflictor}`,
          method: 'POST',
        })
        .reply(200, {});

      tracker.mock.resetCalls();
      await chainflow().call(createUser).call(createRole).run();

      assert.equal(tracker.mock.callCount(), 2);
      assert.deepEqual(
        tracker.mock.calls[1].arguments[0]?.body,
        JSON.stringify({
          userId: 'some-id',
          type: 'ENGINEER',
        }),
      );
    });
  });

  describe('when a source node is provided directly to input nodes with callback', () => {
    it('should take the value from the specified source', async () => {
      const createUser = factory.post(`/user-${deconflictor}`).body({
        name: 'Tom',
      });

      const createRole = factory.post(`/role-${deconflictor}`).body({
        name: source(createUser.resp.name, (name: string) => name.toUpperCase()),
        type: 'ENGINEER',
      });

      const tracker = mock.method(http, 'httpReq');

      client
        .intercept({
          path: `/user-${deconflictor}`,
          method: 'POST',
        })
        .reply(200, {
          name: 'Tom',
        });

      client
        .intercept({
          path: `/role-${deconflictor}`,
          method: 'POST',
        })
        .reply(200, {});

      tracker.mock.resetCalls();
      await chainflow().call(createUser).call(createRole).run();

      assert.equal(tracker.mock.callCount(), 2);
      assert.deepEqual(
        tracker.mock.calls[1].arguments[0]?.body,
        JSON.stringify({
          name: 'TOM',
          type: 'ENGINEER',
        }),
      );
    });
  });

  describe('when multiple source nodes are provided directly to input nodes with callback', () => {
    it('should take the value from the specified source', async () => {
      const createUser = factory.post(`/user-${deconflictor}`).body({
        name: 'Tom',
      });

      const getUser = factory.get(`/user-${deconflictor}`);

      const createRole = factory.post(`/role-${deconflictor}`).body({
        name: sources([createUser.resp.name, getUser.resp.name], (name: string) =>
          name.toUpperCase(),
        ),
        type: 'ENGINEER',
      });

      const tracker = mock.method(http, 'httpReq');

      client
        .intercept({
          path: `/user-${deconflictor}`,
          method: 'POST',
        })
        .reply(200, {
          name: 'Tom',
        })
        .times(2);
      client
        .intercept({
          path: `/user-${deconflictor}`,
          method: 'GET',
        })
        .reply(200, {
          name: 'Harry',
        })
        .times(2);
      client
        .intercept({
          path: `/role-${deconflictor}`,
          method: 'POST',
        })
        .reply(200, {})
        .times(3);

      tracker.mock.resetCalls();
      await chainflow().call(createUser).call(createRole).run();

      assert.equal(tracker.mock.callCount(), 2);
      assert.deepEqual(
        tracker.mock.calls[1].arguments[0]?.body,
        JSON.stringify({
          name: 'TOM',
          type: 'ENGINEER',
        }),
      );

      tracker.mock.resetCalls();
      await chainflow().call(getUser).call(createRole).run();

      assert.equal(tracker.mock.callCount(), 2);
      assert.deepEqual(
        tracker.mock.calls[1].arguments[0]?.body,
        JSON.stringify({
          name: 'HARRY',
          type: 'ENGINEER',
        }),
      );

      tracker.mock.resetCalls();
      await chainflow().call(createUser).call(getUser).call(createRole).run();

      assert.equal(tracker.mock.callCount(), 3);
      assert.deepEqual(
        tracker.mock.calls[2].arguments[0]?.body,
        JSON.stringify({
          name: 'TOM',
          type: 'ENGINEER',
        }),
      );
    });
  });
});
