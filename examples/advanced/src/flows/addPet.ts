import { chainflow } from 'chainflow';
import { addPet } from '../endpoints/petStore';

export const addPetFlow = chainflow().call(addPet);