import { chainflow } from 'chainflow';
import { addPet, login } from '../endpoints';

export const addPetFlow = chainflow().call(login).call(addPet);