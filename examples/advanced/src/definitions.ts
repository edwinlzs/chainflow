import { endpointFactory, valGen, valPool } from 'chainflow';
import { faker } from '@faker-js/faker';

const factory = endpointFactory('127.0.0.1:3001');

// Defining API signatures
export const createUser = factory.post('/user').body({
  name: valGen(faker.person.fullName),
  favAnimal: valPool(['cat', 'dog', 'highland cow']),
});

export const getUser = factory.get('/user').query({
  favAnimal: 'highland cow',
});

export const createNotification = factory.post('/notification').query({
  msg: 'default notification',
});
