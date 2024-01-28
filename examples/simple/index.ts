import { chainflow, link } from 'chainflow';
import {
  createProject,
  createRole,
  createSubmission,
  createUser,
  getSubmission,
  getUser,
} from './src/definitions';

// create the chains
getSubmission.set(({ pathParams: { submissionId } }) => {
  link(submissionId, createSubmission.resp.body.id);
});

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
