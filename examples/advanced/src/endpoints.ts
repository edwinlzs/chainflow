import { faker } from '@faker-js/faker';
import { endpointFactory, gen, link, pool, required, seed } from 'chainflow';

const petStoreAddr = '127.0.0.1:3030';
const paymentsAddr = '127.0.0.1:5050';

const factory = endpointFactory(petStoreAddr);

// Defining API signatures

export const login = factory.get('/user/login').query({
  username: seed.username,
  password: gen(() => faker.string.alphanumeric(8)),
});

const loggedInFactory = endpointFactory(petStoreAddr).headers({
  Authorization: required(),
});

loggedInFactory.set(({ headers }) => {
  link(headers.Authorization, login.resp.body.id);
});

export const addPet = loggedInFactory.post('/pet').body(
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

export const findPetByStatus = loggedInFactory.get('/pet/findByStatus').query({
  status: 'available',
});

export const placeOrder = loggedInFactory.post('/store/order').body({
  petId: required(),
});

// export const findOrder = loggedInFactory.get('/store/order/{orderId}');

const paymentsFactory = endpointFactory(paymentsAddr);

export const makePayment = paymentsFactory.post('/payment/{orderId}').body({
  creditCardNumber: required(),
});