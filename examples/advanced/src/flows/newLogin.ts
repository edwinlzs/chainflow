import { chainflow } from 'chainflow';
import { createUser, login } from '../endpoints/petStore';
import { faker } from '@faker-js/faker';

export const loginFlow = chainflow()
  .call(createUser)
  .call(login)
  .onRun({
    seed: {
      password: faker.string.alphanumeric,
    },
  });
