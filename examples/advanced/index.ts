import { chainflow, seed, link } from 'chainflow';
import { login } from './src/definitions';

// create the chains
login.set(({ query: { username } }) => {
  link(username, seed.username);
});

console.log('Running chainflows');

const addPetFlow = chainflow().call(login);

// run the chainflows

const usernames = ['tom1997', 'harry2000'];

for (const username of usernames) {
  addPetFlow.run({
    seed: {
      username,
    },
  });
}
