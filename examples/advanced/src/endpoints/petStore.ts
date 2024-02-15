import { faker } from '@faker-js/faker';
import { gen, originServer, required, seed, source } from 'chainflow';
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

const loggedInOrigin = originServer(petStoreAddr).headers({
  Authorization: login.resp.body.id,
});

export const addPet = loggedInOrigin
  .post('/pet')
  .body({
    name: seed.pet.name,
    category: seed.pet.category,
  })
  .store((resp) => ({ petId: resp.petId }));

export const updatePetInfo = loggedInOrigin.patch('/pet/{petId}').body({
  description: gen(() => faker.lorem.sentence()),
});

export const listPetForSale = loggedInOrigin.post('/pet/{petId}/sell').body({
  price: seed.pet.price,
});

export const findAvailablePets = loggedInOrigin.get('/pet/findByStatus').query({
  status: 'available',
});

const getDog = (pets: Pet[]) => pets.filter((pet: Pet) => pet.category === 'Dogs')[0].id;

export const placeOrder = loggedInOrigin.post('/store/order').body({
  petId: source(findAvailablePets.resp.body, getDog),
});
