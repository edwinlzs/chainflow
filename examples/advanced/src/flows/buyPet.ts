import { chainflow, seed, link } from 'chainflow';
import { makePayment } from '../endpoints/payments';
import { Pet } from '../servers/types';
import { findAvailablePets, login, placeOrder } from '../endpoints/petStore';

const getDog = (pets: Pet[]) => pets.filter((pet: Pet) => pet.category === 'Dogs')[0].id;

placeOrder.set(({ body: { petId } }) => {
  link(petId, findAvailablePets.resp.body, getDog);
});

makePayment.set(({ pathParams: { orderId }, body: { creditCardNumber } }) => {
  link(orderId, placeOrder.resp.body.id);
  link(creditCardNumber, seed.creditCardNumber);
});

export const buyPetFlow = chainflow()
  .call(login)
  .call(findAvailablePets)
  .call(placeOrder)
  .call(makePayment);
