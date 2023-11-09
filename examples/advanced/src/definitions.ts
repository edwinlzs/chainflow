import { endpointFactory, valGen, valPool } from 'chainflow';
import { faker } from '@faker-js/faker';

const factory = endpointFactory('127.0.0.1:3001');

// Defining API signatures
export const createUser = factory.post('/user').body({
  name: valGen(faker.person.fullName),
  favAnimal: valPool(['cats', 'dogs', 'highland cows']),
});

export const getFavAnimalOfUser = factory.get('/user/favAnimal/{userId}');

export const createNotification = factory.post('/notification').body({
  msg: 'default notification',
});
