import { faker } from '@faker-js/faker';
import { gen, originServer, seed, link } from 'chainflow';
import { Pet } from '../servers/types';

const petStoreAddr = '127.0.0.1:3030';

const origin = originServer(petStoreAddr);

export const createUser = origin.post('/user').body({
  username: seed.username,
  password: seed.password,
});

export const login = origin.get('/user/login').query({
  username: seed.username,
  password: seed.password,
});

originServer(petStoreAddr).headers({
  Authorization: login.resp.body.id,
});

export const addPet = origin
  .post('/pet')
  .body({
    name: seed.pet.name,
    category: seed.pet.category,
  })
  .store((resp) => ({ petId: resp.body.id }));

export const updatePetInfo = origin.patch('/pet/{petId}').body({
  description: gen(() => faker.lorem.sentence()),
});

export const listPetForSale = origin.post('/pet/{petId}/sell').body({
  price: seed.pet.price,
});

export const findAvailablePets = origin.get('/pet').query({
  status: 'available',
});

const getDog = (pets: Pet[]) => pets.filter((pet: Pet) => pet.category === 'Dogs')[0].id;

export const placeOrder = origin.post('/store/order').body({
  petId: link(findAvailablePets.resp.body, getDog),
});
