import { endpointFactory, gen, link, pool, required } from 'chainflow';
import { faker } from '@faker-js/faker';

const factory = endpointFactory('127.0.0.1:3001');

// Defining API signatures

export const login = factory.get('/user/login').query({
  username: required(),
  password: required(),
});

// TODO: add clone?
const loggedInFactory = factory.headers({
  Authorization: required(),
});

factory.set(({ headers }) => {
  link(headers.Authorization, login.resp.token);
});

export const addPet = loggedInFactory.post('/pet').body(
  pool([
    {
      name: 'woofer',
      category: {
        name: 'Dogs',
      },
    },
    {
      name: 'meower',
      category: {
        name: 'Cats',
      },
    },
    {
      name: 'mooer',
      category: {
        name: 'Cows',
      },
    },
  ]),
);

export const findPetByStatus = loggedInFactory.get('/pet/findByStatus').query({
  status: 'available',
});

export const placeOrder = loggedInFactory.post('/store/order').body({
  petId: required(),
});

export const findOrder = loggedInFactory.get('/store/order/{orderId}');
