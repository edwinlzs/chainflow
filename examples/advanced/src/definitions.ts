import { endpointFactory, gen, pool } from 'chainflow';
import { faker } from '@faker-js/faker';

const factory = endpointFactory('127.0.0.1:3001');

// Defining API signatures
// export const createUser = factory.post('/user').body({
//   name: gen(faker.person.fullName),
// });

// export const createGroup = factory.post('/group').body({
//   groupName: 'default',
//   owner: 'default',
// });

// export const createBroadcast = factory.post('/broadcast').body({
//   msg: 'default',
// });

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
  petId: '',
});