import { originServer, pool, required, seed } from 'chainflow';

const petStoreAddr = '127.0.0.1:3030';

const origin = originServer(petStoreAddr);


export const createUser = origin.post('/user').body({
  username: seed.username,
  password: seed.password,
})

export const login = origin.get('/user/login').query({
  username: seed.username,
  password: seed.password,
});

const loggedInOrigin = originServer(petStoreAddr).headers({
  Authorization: login.resp.body.id,
});

export const addPet = loggedInOrigin.post('/pet').body(
  pool([
    {
      name: 'woofer',
      category: 'Dogs',
      price: 1000,
    },
    {
      name: 'meower',
      category: {
        name: 'Cats',
      },
      price: 900,
    },
    {
      name: 'mooer',
      category: {
        name: 'Cows',
      },
      price: 5000,
    },
  ]),
);

export const findAvailablePets = loggedInOrigin.get('/pet/findByStatus').query({
  status: 'available',
});

export const placeOrder = loggedInOrigin.post('/store/order').body({
  petId: required(),
});