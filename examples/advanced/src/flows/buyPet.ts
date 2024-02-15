import { seed, link } from 'chainflow';
import { makePayment } from '../endpoints/payments';
import { findAvailablePets, placeOrder } from '../endpoints/petStore';
import { loginFlow } from './login';

makePayment.set(({ pathParams: { orderId }, body: { creditCardNumber } }) => {
  link(orderId, placeOrder.resp.body.id);
  link(creditCardNumber, seed.creditCardNumber);
});

export const buyPetFlow = loginFlow
  .clone()
  .call(findAvailablePets)
  .call(placeOrder)
  .call(makePayment);
