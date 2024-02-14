import { faker } from '@faker-js/faker';
import express from 'express';
import { db } from '.';

/**
 * Server for a payments processor.
 */
const paymentsApp = express();
paymentsApp.use(express.json());

paymentsApp.use((req, _, next) => {
  console.log(`Payments server received a ${req.method} request at ${req.path}`);
  next();
});

paymentsApp.post('/payment/:orderId', (req, res) => {
  const { creditCardNumber } = req.body;
  const { orderId } = req.params;

  const petId = db.orders[orderId]?.petId;
  const amount = db.pets[petId]?.storeInfo.price;

  const payment = {
    id: faker.string.uuid(),
    creditCardNumber,
    amount,
  };

  db.payments[payment.id] = payment;

  res.send(payment);
});

export { paymentsApp };