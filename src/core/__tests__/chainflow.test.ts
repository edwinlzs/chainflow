import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { chainflow } from '../chainflow';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { link, linkMany } from '../../utils/inputs';
import http from '../../utils/http';
import { endpointFactory } from '../endpointFactory';

describe('#chainflow', () => {
  const agent = new MockAgent();
  setGlobalDispatcher(agent);
  agent.disableNetConnect();
  const client = agent.get('http://127.0.0.1:5000');
  const factory = endpointFactory('127.0.0.1:5000');

  it('should allow API calls', async () => {
    const endpoint = factory.get('/user');
    const tracker = mock.method(endpoint, 'call', () => ({}));

    await chainflow().call(endpoint).run();
    assert.equal(tracker.mock.calls.length, 1);
  });

  it('should allow multiple API calls', async () => {
    const getUser = factory.get('/user');
    const createRole = factory.post('/role');

    const userTracker = mock.method(getUser, 'call', () => ({}));
    const roleTracker = mock.method(createRole, 'call', () => ({}));

    await chainflow().call(getUser).call(createRole).call(getUser).run();

    assert.equal(userTracker.mock.calls.length, 2);
    assert.equal(roleTracker.mock.calls.length, 1);
  });

  // it('should not execute actual call if method is incorrect', async () => {
  //   const getUser = factory.get('/user');

  //   const userTracker = mock.method(getUser, 'call', () => ({}));

  //   await chainflow().call(getUser).run();

  //   assert.equal(userTracker.mock.calls.length, 0);
  // });

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

      assert.equal(userTracker.mock.calls.length, 1);
      assert.equal(roleTracker.mock.calls.length, 1);
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

      assert.equal(roleTracker.mock.calls.length, 1);
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

      assert.equal(roleTracker.mock.calls.length, 1);
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
        assert.equal(tracker.mock.calls.length, 3);
        const roleCall = tracker.mock.calls[2];
        const callBody = JSON.parse(roleCall.arguments?.[0]?.body);
        assert.deepEqual(callBody, {
          name: 'A',
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
        assert.equal(tracker.mock.calls.length, 3);
        const roleCall = tracker.mock.calls[2];
        const callBody = JSON.parse(roleCall.arguments?.[0]?.body);
        assert.deepEqual(callBody, {
          name: 'B',
        });
        tracker.mock.resetCalls();
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
});
