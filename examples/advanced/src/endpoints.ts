import { faker } from '@faker-js/faker';
import { originServer, gen, link, pool, required, seed } from 'chainflow';

const petStoreAddr = '127.0.0.1:3030';
const paymentsAddr = '127.0.0.1:5050';

const origin = originServer(petStoreAddr);

// Defining API signatures

export const login = origin.get('/user/login').query({
  username: seed.username,
  password: gen(() => faker.string.alphanumeric(8)),
});

const loggedInOrigin = originServer(petStoreAddr).headers({
  Authorization: required(),
});

loggedInOrigin.set(({ headers }) => {
  link(headers.Authorization, login.resp.body.id);
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

export const findPetByStatus = loggedInOrigin.get('/pet/findByStatus').query({
  status: 'available',
});

export const placeOrder = loggedInOrigin.post('/store/order').body({
  petId: required(),
});

// export const findOrder = loggedInOrigin.get('/store/order/{orderId}');

const paymentsOrigin = originServer(paymentsAddr);

export const makePayment = paymentsOrigin.post('/payment/{orderId}').body({
  creditCardNumber: required(),
});