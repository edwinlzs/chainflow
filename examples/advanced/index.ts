// run the chainflows
import { faker } from '@faker-js/faker';
import { addPetFlow, buyPetFlow } from './src/flows';

const usernames = ['tom1997', 'harry2000', 'jane9000'];

for (const username of usernames) {
  addPetFlow.run({
    seed: {
      username,
    },
  });
}

const buyerNames = [
  { name: faker.person.fullName(), creditCardNumber: faker.finance.creditCardNumber() },
  { name: faker.person.fullName(), creditCardNumber: faker.finance.creditCardNumber() },
];

for (const { name, creditCardNumber } of buyerNames) {
  buyPetFlow.run({
    seed: {
      username: name,
      creditCardNumber,
    },
  });
}
