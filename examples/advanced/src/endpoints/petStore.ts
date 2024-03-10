import { faker } from '@faker-js/faker';
import { gen, origin, seed, link } from 'chainflow';
import { Pet } from '../servers/types';

const petStoreAddr = '127.0.0.1:3030';

const petStoreBackend = origin(petStoreAddr);

export const createUser = petStoreBackend.post('/user').body({
  username: seed.username,
  password: seed.password,
});

export const login = petStoreBackend.get('/user/login').query({
  username: seed.username,
  password: seed.password,
});

petStoreBackend.headers({
  Authorization: login.resp.body.id,
});

export const addPet = petStoreBackend
  .post('/pet')
  .body({
    name: seed.pet.name,
    category: seed.pet.category,
  })
  .store((resp) => ({ petId: resp.body.id }));

export const updatePetInfo = petStoreBackend.patch('/pet/{petId}').body({
  description: gen(() => faker.lorem.sentence()),
});

export const listPetForSale = petStoreBackend.post('/pet/{petId}/sell').body({
  price: seed.pet.price,
});

export const findAvailablePets = petStoreBackend.get('/pet').query({
  status: 'available',
});

const getDog = (pets: Pet[]) => pets.filter((pet: Pet) => pet.category === 'Dogs')[0].id;

export const placeOrder = petStoreBackend.post('/store/order').body({
  petId: link(findAvailablePets.resp.body, getDog),
});
