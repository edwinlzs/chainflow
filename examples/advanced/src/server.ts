import { faker } from '@faker-js/faker';
import express, { Request } from 'express';
import { Order, Pet, Payment, User } from './types';

type ExpressRequest = Request<unknown, unknown, unknown, Record<string, string>>;

/** Super simple emulation of a DB. */
const db = {
  users: {} as Record<string, User>,
  pets: {} as Record<string, Pet>,
  orders: {} as Record<string, Order>,
  payments: {} as Record<string, Payment>,
};

/**
 * Server for a pet store.
 */
const PET_STORE_PORT = 3030;

const petStoreApp = express();
petStoreApp.use(express.json());

petStoreApp.use((req, _, next) => {
  console.log(`Pet store server received a ${req.method} request at ${req.path}`);
  next();
});

petStoreApp.get('/user/login', (req: ExpressRequest, res) => {
  const { username, password } = req.query;
  const id = faker.string.uuid();
  const user = {
    id,
    username,
    password,
  };
  db.users[id] = user;

  res.status(200).send(user);
});

petStoreApp.post('/pet', (req, res) => {
  const { name, category, price } = req.body;
  const id = faker.string.uuid();

  const pet = {
    id,
    name,
    category,
    storeInfo: {
      status: 'available',
      price,
    },
  };
  db.pets[id] = pet;

  res.send(pet);
});

petStoreApp.get('/pet/findByStatus', (req: ExpressRequest, res) => {
  const { status } = req.query;

  const result = Object.values(db.pets).filter((pet) => pet.storeInfo.status === status);
  res.send(result);
});

petStoreApp.post('/store/order', (req, res) => {
  const { petId } = req.body;

  const order = {
    id: faker.string.uuid(),
    petId,
    paid: false,
  };
  db.orders[order.id] = order;
  res.send(order);
})

petStoreApp.listen(PET_STORE_PORT, () => {
  console.log(`Pet store server listening on port ${PET_STORE_PORT}`);
});

/**
 * Server for a payments processor.
 */
const PAYMENTS_PROCESSOR_PORT = 5050;

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

paymentsApp.listen(PAYMENTS_PROCESSOR_PORT, () => {
  console.log(`Payments server listening on port ${PAYMENTS_PROCESSOR_PORT}`);
});
