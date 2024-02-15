// run the chainflows
import { faker } from '@faker-js/faker';
import { sellPetFlow, buyPetFlow } from './src/flows';

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

// admin adds multiple pets to the store
for (const pet of pets) {
  sellPetFlow.run({
    seed: {
      username: 'admin',
      password: 'adminpass',
      pet: {
        name: pet.name,
        category: pet.category,
        price: pet.price,
      },
    },
  });
}

// create buyers that purchase pets
const buyers = ['tom1997', 'harry2000', 'jane9000'];
for (const username of buyers) {
  buyPetFlow.run({
    seed: {
      username,
      password: faker.string.alphanumeric(8),
      creditCardNumber: faker.finance.creditCardNumber(),
    },
  });
}
