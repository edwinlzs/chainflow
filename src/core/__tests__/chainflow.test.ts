import { IEndpoint, chainflow } from '../../core/chainflow';
import { SEED_HASH, STORE_HASH } from '../utils/constants';
// import { link, linkMerge } from '../../core/utils/link';
// import { config } from '../../core/utils/config';
// import { required } from '../../core/utils/initializers';

const mockEndpoint =(path: string): IEndpoint<unknown> => ({
  call: jest.fn(async () => ({ resp: {} })),
  hash: path,
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
      (createRole.call as jest.Mock).mockImplementationOnce(() => { throw new Error() });

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

    /** @todo add utest for logging state of previous run */

    it('should reset its state and use a clean slate for the next run', async () => {
      (createUser.call as jest.Mock).mockImplementationOnce(() => ({
        resp: { userId: 'userId A' },
      }));
      await testFlow.run();

      let sources = (createRole.call as jest.Mock).mock.calls[0][0];

      expect(createRole.call).toHaveBeenCalledTimes(1);
      expect(sources[createUser.hash].length).toBe(1);
      expect(
        sources[createUser.hash][0],
      ).toStrictEqual({ userId: 'userId A' });
      (createRole.call as jest.Mock).mockClear();

      (createUser.call as jest.Mock).mockImplementationOnce(() => ({
        resp: { userId: 'userId B' },
      }));
      await testFlow.run();

      sources = (createRole.call as jest.Mock).mock.calls[0][0];

      expect(createRole.call).toHaveBeenCalledTimes(1);
      expect(sources[createUser.hash].length).toBe(1);
      expect(
        sources[createUser.hash][0],
      ).toStrictEqual({ userId: 'userId B' });
    });
  });

  // describe('when call options are provided', () => {
  //   const addUser = origin
  //     .post('/{groupId}/user')
  //     .body({
  //       name: 'default',
  //     })
  //     .query({
  //       role: 'default',
  //     })
  //     .headers({
  //       token: 'default',
  //     });

  //   const tracker = jest.spyOn(http, 'request');

  //   it('should call the endpoint with the given call options', async () => {
  //     tracker.mockClear();
  //     client
  //       .intercept({
  //         path: '/someGroup/user',
  //         method: 'POST',
  //         query: {
  //           role: 'someRole',
  //         },
  //       })
  //       .reply(200, {});

  //     await chainflow()
  //       .call(addUser, {
  //         body: {
  //           name: 'some name',
  //         },
  //         pathParams: {
  //           groupId: 'someGroup',
  //         },
  //         query: {
  //           role: 'someRole',
  //         },
  //         headers: {
  //           token: 'some token',
  //         },
  //       })
  //       .run();
  //     expect(tracker).toHaveBeenCalledTimes(1);
  //     const arg = tracker.mock.calls[0][0];
  //     expect(arg?.body).toStrictEqual({
  //       name: 'some name',
  //     });
  //     expect(arg?.path).toBe('/someGroup/user?role=someRole');
  //     expect(arg?.headers).toStrictEqual({
  //       token: 'some token',
  //     });
  //   });
  // });

  // describe('when run options are provided', () => {
  //   const userPath = uniquePath('/user');
  //   const createUser = origin.post(userPath).body({
  //     name: 'default',
  //   });

  //   createUser.set(({ body: { name } }) => {
  //     link(name, seed.username);
  //   });

  //   const tracker = jest.spyOn(http, 'request');

  //   it('should call the endpoint with the given seed', async () => {
  //     tracker.mockClear();
  //     client
  //       .intercept({
  //         path: userPath,
  //         method: 'POST',
  //       })
  //       .reply(200, {});

  //     await chainflow().call(createUser).seed({ username: 'some name' }).run();
  //     expect(tracker).toHaveBeenCalledTimes(1);
  //     const arg = tracker.mock.calls[0][0];
  //     expect(arg?.body).toStrictEqual({
  //       name: 'some name',
  //     });
  //   });
  // });

  // describe('when a source node is provided directly to input nodes', () => {
  //   const userPath = uniquePath('/user');
  //   const rolePath = uniquePath('/role');
  //   it('should take the value from the specified source', async () => {
  //     const createUser = origin.post(userPath).body({
  //       name: 'Tom',
  //     });

  //     const createRole = origin.post(rolePath).body({
  //       userId: createUser.resp.body.id,
  //       type: 'ENGINEER',
  //     });

  //     const tracker = jest.spyOn(http, 'request');
  //     tracker.mockClear();

  //     client
  //       .intercept({
  //         path: userPath,
  //         method: 'POST',
  //       })
  //       .reply(200, {
  //         id: 'some-id',
  //       });

  //     client
  //       .intercept({
  //         path: rolePath,
  //         method: 'POST',
  //       })
  //       .reply(200, {});

  //     await chainflow().call(createUser).call(createRole).run();

  //     expect(tracker).toHaveBeenCalledTimes(2);
  //     expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
  //       userId: 'some-id',
  //       type: 'ENGINEER',
  //     });
  //   });
  // });

  // describe('when a source node is provided directly to input nodes with callback', () => {
  //   const userPath = uniquePath('/user');
  //   const rolePath = uniquePath('/role');
  //   it('should take the value from the specified source', async () => {
  //     const createUser = origin.post(userPath).body({
  //       name: 'Tom',
  //     });

  //     const createRole = origin.post(rolePath).body({
  //       name: link(createUser.resp.body.name, (name: string) => name.toUpperCase()),
  //       type: 'ENGINEER',
  //     });

  //     const tracker = jest.spyOn(http, 'request');
  //     tracker.mockClear();

  //     client
  //       .intercept({
  //         path: userPath,
  //         method: 'POST',
  //       })
  //       .reply(200, {
  //         name: 'Tom',
  //       });

  //     client
  //       .intercept({
  //         path: rolePath,
  //         method: 'POST',
  //       })
  //       .reply(200, {});

  //     await chainflow().call(createUser).call(createRole).run();

  //     expect(tracker).toHaveBeenCalledTimes(2);
  //     expect(tracker.mock.calls[1][0]?.body).toStrictEqual({
  //       name: 'TOM',
  //       type: 'ENGINEER',
  //     });
  //   });
  // });

  // describe('when a chainflow is cloned', () => {
  //   const userPath = uniquePath('/user');
  //   const rolePath = uniquePath('/role');
  //   it('the cloned flow can be extended without changing the original', async () => {
  //     const createUser = origin.post(userPath).body({
  //       name: 'Tom',
  //     });

  //     const createRole = origin.post(rolePath).body({
  //       name: createUser.resp.body.name,
  //       type: 'ENGINEER',
  //     });

  //     const tracker = jest.spyOn(http, 'request');
  //     tracker.mockClear();

  //     client
  //       .intercept({
  //         path: userPath,
  //         method: 'POST',
  //       })
  //       .reply(200, {
  //         name: 'Tom',
  //       })
  //       .times(2);
  //     client
  //       .intercept({
  //         path: rolePath,
  //         method: 'POST',
  //       })
  //       .reply(200, {});

  //     const flow1 = chainflow().call(createUser);
  //     await flow1.run();
  //     expect(tracker).toHaveBeenCalledTimes(1);

  //     tracker.mockClear();
  //     const flow2 = flow1.clone().call(createRole);
  //     await flow2.run();
  //     expect(tracker).toHaveBeenCalledTimes(2);
  //   });
  // });

  // describe('when a chainflow is extended', () => {
  //   const userPath = uniquePath('/user');
  //   const rolePath = uniquePath('/role');
  //   it('the original flow should append the callqueue of the extending flow', async () => {
  //     const createUser = origin.post(userPath).body({
  //       name: 'Tom',
  //     });

  //     const createRole = origin.post(rolePath).body({
  //       name: createUser.resp.body.name,
  //       type: 'ENGINEER',
  //     });

  //     const tracker = jest.spyOn(http, 'request');
  //     tracker.mockClear();
  //     const flow1 = chainflow().call(createUser);
  //     const flow2 = chainflow().call(createRole);

  //     client
  //       .intercept({
  //         path: userPath,
  //         method: 'POST',
  //       })
  //       .reply(200, {
  //         name: 'Tom',
  //       });
  //     client
  //       .intercept({
  //         path: rolePath,
  //         method: 'POST',
  //       })
  //       .reply(200, {});

  //     await flow1.extend(flow2).run();
  //     expect(tracker).toHaveBeenCalledTimes(2);
  //   });
  // });

  describe('when a chainflow calls endpoints that use its store', () => {
    describe('when an endpoint defines a store value', () => {
      const createUser = mockEndpoint('user');
      const createRole = mockEndpoint('role');

      it('should pass values through the store', async () => {
        (createUser.call as jest.Mock).mockImplementationOnce(() => ({
          resp: {},
          store: { username: 'Tom' },
        }));

        await chainflow().call(createUser).call(createRole).run();
        expect(createRole.call).toHaveBeenCalledTimes(1);
        expect((createRole.call as jest.Mock).mock.calls[0][0][STORE_HASH][0]).toStrictEqual({ username: 'Tom' });
      });
    });

    describe('when an endpoint defines a deeply nested store value', () => {
      const createUser = mockEndpoint('user');
      const createRole = mockEndpoint('role');
      it('should pass values through the store', async () => {
        (createUser.call as jest.Mock).mockImplementationOnce(() => ({
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
        expect((createRole.call as jest.Mock).mock.calls[0][0][STORE_HASH][0]).toStrictEqual({
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
          (createUser.call as jest.Mock).mockImplementationOnce(() => ({
            resp: {},
            store: {
              username: 'Tom',
            },
          }));
          (getUser.call as jest.Mock).mockImplementationOnce(() => ({
            resp: {},
            store: {
              username: 'Jane',
            },
          }));

          await chainflow().call(createUser).call(getUser).call(createRole).run();
          expect(createRole.call).toHaveBeenCalledTimes(1);
          expect((createRole.call as jest.Mock).mock.calls[0][0][STORE_HASH][0]).toStrictEqual({
            username: 'Jane',
          });
        });
      });
  });

  describe('when a chainflow continuesFrom another chainflow run', () => {
    const login = mockEndpoint('login');
    const addUser = mockEndpoint('user');
    it('should keep the stored value', async () => {
      (login.call as jest.Mock).mockImplementationOnce(() => ({
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
            [SEED_HASH]: [{ username }],
            [login.hash]: [{ id: 'admin-id' }],
          }),
        );
      }
    });
  });
});
