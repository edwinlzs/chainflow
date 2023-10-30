import { chainflow, InputNodes, link } from 'chainflow';
import {
  createProject,
  createRole,
  createSubmission,
  createUser,
  getSubmission,
  getUser,
} from './src/definitions';

// create the chains
getUser.set(({ query: { age } }: InputNodes) => {
  link(age, createUser.resp.details.age);
});

createRole.set(({ body: { user_id } }: InputNodes) => {
  link(user_id, createUser.resp.id);
});

createProject.set(({ body: { creator_id } }: InputNodes) => {
  link(creator_id, createUser.resp.id);
});

createSubmission.set(({ body: { creator_id, project_id } }: InputNodes) => {
  link(creator_id, createUser.resp.id);
  link(project_id, createProject.resp.id);
});

getSubmission.set(({ pathParams: { submissionId } }) => {
  link(submissionId, createSubmission.resp.id);
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
