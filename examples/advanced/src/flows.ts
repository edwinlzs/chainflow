import { chainflow, seed, link } from 'chainflow';
import { addPet, findPetByStatus, login, placeOrder } from './endpoints';

login.set(({ query: { username } }) => {
  link(username, seed.username);
});

export const addPetFlow = chainflow().call(login).call(addPet);

interface PetStatus {
  status: string;
  category: { name: string };
}

const getDog = (pets: PetStatus[]) =>
  pets.filter((pet: PetStatus) => pet.category.name === 'Dogs')[0];

placeOrder.set(({ body: { petId } }) => {
  link(petId, findPetByStatus.resp, getDog);
});

export const buyPetFlow = chainflow().call(login).call(findPetByStatus).call(placeOrder);
