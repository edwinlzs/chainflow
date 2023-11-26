import { endpointFactory, gen, pool, required } from 'chainflow';
import { faker } from '@faker-js/faker';

const factory = endpointFactory('127.0.0.1:3001');

// Defining API signatures

export const login = factory.get('/user/login').query({
  username: required(),
  password: required(),
});

export const addPet = factory.post('/pet').body(
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

export const placeOrder = factory.post('/store/order').body({
  petId: required(),
});

export const findOrder = factory.get('/store/order/{orderId}');