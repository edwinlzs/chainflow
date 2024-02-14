import { faker } from '@faker-js/faker';
import express, { Request } from 'express';
import { db } from '.';

type ExpressRequest = Request<unknown, unknown, unknown, Record<string, string>>;

/**
 * Server for a pet store.
 */
const petStoreApp = express();
petStoreApp.use(express.json());

petStoreApp.use((req, _, next) => {
  console.log(`Pet store server received a ${req.method} request at ${req.path}`);
  next();
});

petStoreApp.post('/user', (req, res) => {
  const { username, password } = req.body;
  const id = faker.string.uuid();
  const user = {
    id,
    username,
    password,
  };
  db.users[id] = user;

  res.status(200).send(user);
});

petStoreApp.get('/user/login', (req: ExpressRequest, res) => {
  const { username, password } = req.query;
  const user = Object.values(db.users).filter(
    (user) => user.username === username && user.password === password,
  )[0];

  if (user) {
    res.status(200).send(user);
  } else {
    res.status(401).send();
  }
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
});

export { petStoreApp };
