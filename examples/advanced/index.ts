// run the chainflows
import { faker } from '@faker-js/faker';
import { sellPetFlow, buyPetFlow } from './src/flows';
import { enableLogs } from 'chainflow';

enableLogs();

const pets = [
  {
    name: 'woofer',
    category: 'Dogs',
    price: 1000,
  },
  {
    name: 'meower',
    category: 'Cats',
    price: 900,
  },
  {
    name: 'mooer',
    category: 'Cows',
    price: 5000,
  },
];

const runFlows = async () => {
  // admin adds multiple pets to the store
  for (const pet of pets) {
    await sellPetFlow
      .seed({
        username: 'admin',
        password: 'adminpass',
        pet: {
          name: pet.name,
          category: pet.category,
          price: pet.price,
        },
      })
      .run();
  }

  // create buyers that purchase pets
  const buyers = ['tom1997', 'harry2000', 'jane9000'];
  for (const username of buyers) {
    await buyPetFlow
      .seed({
        username,
        password: faker.string.alphanumeric(8),
        creditCardNumber: faker.finance.creditCardNumber(),
      })
      .run();
  }
};

runFlows();
