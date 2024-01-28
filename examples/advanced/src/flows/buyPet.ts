import { chainflow, seed, link } from 'chainflow';
import { findPetByStatus, login, makePayment, placeOrder } from '../endpoints';
import { Pet } from '../types';

const getDog = (pets: Pet[]) => pets.filter((pet: Pet) => pet.category === 'Dogs')[0].id;

placeOrder.set(({ body: { petId } }) => {
  link(petId, findPetByStatus.resp.body, getDog);
});

makePayment.set(({ pathParams: { orderId }, body: { creditCardNumber } }) => {
  link(orderId, placeOrder.resp.body.id);
  link(creditCardNumber, seed.creditCardNumber);
});

export const buyPetFlow = chainflow()
  .call(login)
  .call(findPetByStatus)
  .call(placeOrder)
  .call(makePayment);
