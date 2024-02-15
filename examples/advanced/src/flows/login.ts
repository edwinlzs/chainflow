import { chainflow } from 'chainflow';
import { createUser, login } from '../endpoints/petStore';

export const loginFlow = chainflow()
  .call(createUser)
  .call(login);
