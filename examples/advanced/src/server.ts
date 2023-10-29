import { faker } from '@faker-js/faker';
import express from 'express';

const PORT = 3001;

const app = express();
app.use(express.json());

/** Super simple emulation of a DB. */
const db = {
  users: [] as any[],
};

app.post('/user', (req, res) => {
  console.log(`Received POST call at /user with body: ${JSON.stringify(req.body)}`);
  const user = req.body.json;
  (user.id = faker.string.uuid()), db.users.push(user);

  res.send(user);
});

app.get('/user', (req, res) => {
  console.log(`Received GET call at /user with query: ${JSON.stringify(req.query, null, 2)}`);

  const favAnimal = req.query;
  const usersWithFavAnimal = db.users.filter((user) => user.favAnimal === favAnimal);

  res.send({
    users: usersWithFavAnimal,
  });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
