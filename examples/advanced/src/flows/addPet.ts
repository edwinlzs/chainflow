import { chainflow, seed, link } from 'chainflow';
import { addPet, login } from '../endpoints';

login.set(({ query: { username } }) => {
  link(username, seed.username);
});

export const addPetFlow = chainflow().call(login).call(addPet);