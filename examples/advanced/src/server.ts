import { faker } from '@faker-js/faker';
import express from 'express';

const PORT = 3001;

const app = express();
app.use(express.json());

/** Super simple emulation of a DB. */
const db = {
  users: [] as any[],
  pets: [] as any[],
};

app.get('/user', (req, res) => {
  console.log(`Received POST call at /user with query: ${JSON.stringify(req.query)}`);

  const { username, password } = req.query;
  const id = faker.string.uuid();
  const user = {
    id,
    username,
    password,
  };
  db.users.push(user);

  res.send(user);
});

app.post('/pet', (req, res) => {
  const { name, category } = req.body;

  
})

app.get('/pet/findByStatus', (req, res) => {
  const { status } = req.query;

  const result = db.pets.filter((pet) => pet.status === status);
  res.send(result);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
