// run the chainflows
import { addPetFlow } from './src/flows';

const usernames = ['tom1997', 'harry2000', 'jane9000'];

for (const username of usernames) {
  addPetFlow.run({
    seed: {
      username,
    },
  });
}
