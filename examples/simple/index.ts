import { chainflow } from 'chainflow';
import {
  createProject,
  createRole,
  createSubmission,
  createUser,
  getSubmission,
  getUser,
} from './src/endpoints';

console.log('Running chainflows');

// run the chainflows
const flow = chainflow()
  .call(createUser)
  .call(getUser)
  .call(createRole)
  .call(createProject)
  .call(createSubmission)
  .call(getSubmission);

flow.run();
