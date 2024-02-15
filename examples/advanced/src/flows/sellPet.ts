import { link, store } from 'chainflow';
import { addPet, listPetForSale, updatePetInfo } from '../endpoints/petStore';
import { loginFlow } from './login';

updatePetInfo.set(({ pathParams }) => {
  link(pathParams.petId, store.petId);
});

listPetForSale.set(({ pathParams }) => {
  link(pathParams.petId, store.petId);
});

export const sellPetFlow = loginFlow.clone().call(addPet).call(updatePetInfo).call(listPetForSale);
