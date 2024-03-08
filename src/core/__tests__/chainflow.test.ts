import { IEndpoint, chainflow } from '../../core/chainflow';
import { SEED_ID, STORE_ID } from '../utils/constants';

const mockEndpoint = (path: string): IEndpoint<unknown, unknown, unknown> => ({
  call: jest.fn(async () => ({ req: {}, resp: {} })),
  details: path,
  id: path,
});

describe('#chainflow', () => {
  it('should allow API calls', async () => {
    const endpoint = mockEndpoint('user');

    await chainflow().call(endpoint).run();
    expect(endpoint.call).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple API calls', async () => {
    const getUser = mockEndpoint('user');
    const createRole = mockEndpoint('role');

    await chainflow().call(getUser).call(createRole).call(getUser).run();

    expect(getUser.call).toHaveBeenCalledTimes(2);
    expect(createRole.call).toHaveBeenCalledTimes(1);
  });

  describe('when an endpoint call throws an error', () => {
    const getUser = mockEndpoint('user');
    const createRole = mockEndpoint('role');

    it('should break the chainflow', async () => {
      (createRole.call as jest.Mock).mockImplementationOnce(async () => {
        throw new Error();
      });

      await expect(
        chainflow().call(getUser).call(createRole).call(getUser).run(),
      ).rejects.toThrow();

      expect(getUser.call).toHaveBeenCalledTimes(1);
      expect(createRole.call).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a chainflow has finished a run', () => {
    const createUser = mockEndpoint('user');
    const createRole = mockEndpoint('role');

    const testFlow = chainflow().call(createUser).call(createRole);

    it('should return the call events accumulated from the run', async () => {
      const createUserResp = { userId: 'some-userId' };
      const createRoleResp = { status: 'ok' };
      (createUser.call as jest.Mock).mockImplementationOnce(async () => ({
        req: { value: 'request-1' },
        resp: createUserResp,
      }));
      (createRole.call as jest.Mock).mockImplementationOnce(async () => ({
        req: { value: 'request-2' },
        resp: createRoleResp,
      }));
      await testFlow.run();

      expect(testFlow.events).toStrictEqual([
        {
          details: 'user',
          req: {
            value: 'request-1',
          },
          resp: createUserResp,
        },
        {
          details: 'role',
          req: {
            value: 'request-2',
          },
          resp: createRoleResp,
        },
      ]);
    });

    it('should reset its state and use a clean slate for the next run', async () => {
      (createRole.call as jest.Mock).mockClear();
      (createUser.call as jest.Mock).mockImplementationOnce(async () => ({
        req: { value: 'request-3' },
        resp: { userId: 'userId A' },
      }));
      (createRole.call as jest.Mock).mockImplementationOnce(async () => ({
        req: { value: 'request-4' },
        resp: { value: 'value A' },
      }));
      await testFlow.run();

      let sources = (createRole.call as jest.Mock).mock.calls[0][0];

      expect(createRole.call).toHaveBeenCalledTimes(1);
      expect(sources[createUser.id].length).toBe(1);
      expect(sources[createUser.id][0]).toStrictEqual({ userId: 'userId A' });
      (createRole.call as jest.Mock).mockClear();

      (createUser.call as jest.Mock).mockImplementationOnce(async () => ({
        req: { value: 'request-5' },
        resp: { userId: 'userId B' },
      }));
      (createRole.call as jest.Mock).mockImplementationOnce(async () => ({
        req: { value: 'request-6' },
        resp: { value: 'value B' },
      }));
      await testFlow.run();

      sources = (createRole.call as jest.Mock).mock.calls[0][0];

      expect(createRole.call).toHaveBeenCalledTimes(1);
      expect(sources[createUser.id].length).toBe(1);
      expect(sources[createUser.id][0]).toStrictEqual({ userId: 'userId B' });
      expect(testFlow.events).toStrictEqual([
        {
          details: 'user',
          req: { value: 'request-5' },
          resp: { userId: 'userId B' },
        },
        {
          details: 'role',
          req: { value: 'request-6' },
          resp: { value: 'value B' },
        },
      ]);
    });
  });

  describe('when call options are provided', () => {
    const addUser = mockEndpoint('user');

    it('should call the endpoint with the given call options', async () => {
      const testOpts = {
        name: 'some name',
        headers: {
          token: 'some token',
        },
      };
      await chainflow().call(addUser, testOpts).run();
      expect(addUser.call).toHaveBeenCalledTimes(1);
      expect((addUser.call as jest.Mock).mock.calls[0][1]).toStrictEqual(testOpts);
    });
  });

  describe('when seed is provided', () => {
    const createUser = mockEndpoint('user');

    it('should call the endpoint with the given seed', async () => {
      await chainflow().call(createUser).seed({ username: 'some name' }).run();
      expect(createUser.call).toHaveBeenCalledTimes(1);
      expect((createUser.call as jest.Mock).mock.calls[0][0][SEED_ID][0]).toStrictEqual({
        username: 'some name',
      });
    });
  });

  describe('when a chainflow is cloned', () => {
    const createUser = mockEndpoint('user');
    const createRole = mockEndpoint('role');
    it('the cloned flow can be extended without changing the original', async () => {
      const flow1 = chainflow().call(createUser);
      await flow1.run();
      expect(createUser.call).toHaveBeenCalledTimes(1);
      (createUser.call as jest.Mock).mockClear();

      const flow2 = flow1.clone().call(createRole);
      await flow2.run();
      expect(createUser.call).toHaveBeenCalledTimes(1);
      expect(createRole.call).toHaveBeenCalledTimes(1);
      (createUser.call as jest.Mock).mockClear();
      (createRole.call as jest.Mock).mockClear();

      await flow1.run();
      expect(createUser.call).toHaveBeenCalledTimes(1);
      expect(createRole.call).toHaveBeenCalledTimes(0);
    });
  });

  describe('when a chainflow is extended', () => {
    const createUser = mockEndpoint('user');
    const createRole = mockEndpoint('role');
    it('the original flow should append the callqueue of the extending flow', async () => {
      const flow1 = chainflow().call(createUser);
      const flow2 = chainflow().call(createRole);

      await flow1.extend(flow2).run();
      expect(createUser.call).toHaveBeenCalledTimes(1);
      expect(createRole.call).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a chainflow calls endpoints that use its store', () => {
    describe('when an endpoint defines a store value', () => {
      const createUser = mockEndpoint('user');
      const createRole = mockEndpoint('role');

      it('should pass values through the store', async () => {
        (createUser.call as jest.Mock).mockImplementationOnce(async () => ({
          resp: {},
          store: { username: 'Tom' },
        }));

        await chainflow().call(createUser).call(createRole).run();
        expect(createRole.call).toHaveBeenCalledTimes(1);
        expect((createRole.call as jest.Mock).mock.calls[0][0][STORE_ID][0]).toStrictEqual({
          username: 'Tom',
        });
      });
    });

    describe('when an endpoint defines a deeply nested store value', () => {
      const createUser = mockEndpoint('user');
      const createRole = mockEndpoint('role');
      it('should pass values through the store', async () => {
        (createUser.call as jest.Mock).mockImplementationOnce(async () => ({
          resp: {},
          store: {
            user: {
              profile: {
                firstName: 'Tom',
              },
            },
          },
        }));

        await chainflow().call(createUser).call(createRole).run();
        expect(createRole.call).toHaveBeenCalledTimes(1);
        expect((createRole.call as jest.Mock).mock.calls[0][0][STORE_ID][0]).toStrictEqual({
          user: {
            profile: {
              firstName: 'Tom',
            },
          },
        });
      });
    });

    describe('when multiple endpoints put values into the same store key', () => {
      const createUser = mockEndpoint('createUser');
      const getUser = mockEndpoint('getUser');
      const createRole = mockEndpoint('role');
      it('should have the later endpoint call override the store value put by the previous call', async () => {
        (createUser.call as jest.Mock).mockImplementationOnce(async () => ({
          resp: {},
          store: {
            username: 'Tom',
          },
        }));
        (getUser.call as jest.Mock).mockImplementationOnce(async () => ({
          resp: {},
          store: {
            username: 'Jane',
          },
        }));

        await chainflow().call(createUser).call(getUser).call(createRole).run();
        expect(createRole.call).toHaveBeenCalledTimes(1);
        expect((createRole.call as jest.Mock).mock.calls[0][0][STORE_ID][0]).toStrictEqual({
          username: 'Jane',
        });
      });
    });
  });

  describe('when a chainflow continuesFrom another chainflow run', () => {
    const login = mockEndpoint('login');
    const addUser = mockEndpoint('user');
    it('should keep the stored value', async () => {
      (login.call as jest.Mock).mockImplementationOnce(async () => ({
        resp: { id: 'admin-id' },
      }));

      const loggedInFlow = await chainflow().call(login).run();
      const addUserFlow = chainflow().call(addUser).continuesFrom(loggedInFlow);

      const usernames = ['tom', 'dude', 'jane'];
      for (const username of usernames) {
        (addUser.call as jest.Mock).mockClear();
        await addUserFlow.seed({ username }).run();

        expect(addUser.call).toHaveBeenCalledTimes(1);
        expect((addUser.call as jest.Mock).mock.calls[0][0]).toEqual(
          expect.objectContaining({
            [SEED_ID]: [{ username }],
            [login.id]: [{ id: 'admin-id' }],
          }),
        );
      }
    });
  });
});
