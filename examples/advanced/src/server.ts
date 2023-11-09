import { faker } from '@faker-js/faker';
import express from 'express';

const PORT = 3001;

const app = express();
app.use(express.json());

/** Super simple emulation of a DB. */
const db = {
  users: [] as any[],
  notifications: [] as any[],
};

app.post('/user', (req, res) => {
  console.log(`Received POST call at /user with body: ${JSON.stringify(req.body)}`);

  const user = req.body;
  user.id = faker.string.uuid();
  db.users.push(user);

  res.send(user);
});

app.get('/user/favAnimal/:userId', (req, res) => {
  console.log(`Received GET call at /user/favAnimal/:userId with path parameters: ${JSON.stringify(req.params, null, 2)}`);

  const { userId } = req.params;
  const favAnimal = db.users.filter((user) => user.id === userId)[0]?.favAnimal;

  res.send({
    favAnimal,
  });
});

app.post('/notification', (req, res) => {
  console.log(`Received POST call at /notification with body: ${JSON.stringify(req.body, null, 2)}`);
  db.notifications.push(req.body);
  res.status(200).send({});
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
