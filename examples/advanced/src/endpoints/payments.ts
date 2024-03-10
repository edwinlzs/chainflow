import { origin, required } from 'chainflow';

const paymentsAddr = '127.0.0.1:5050';

const paymentsBackend = origin(paymentsAddr);

export const makePayment = paymentsBackend.post('/payment/{orderId}').body({
  creditCardNumber: required(),
});