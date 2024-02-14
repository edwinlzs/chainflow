import { originServer, required } from 'chainflow';

const paymentsAddr = '127.0.0.1:5050';

const paymentsOrigin = originServer(paymentsAddr);

export const makePayment = paymentsOrigin.post('/payment/{orderId}').body({
  creditCardNumber: required(),
});