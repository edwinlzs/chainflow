/** USER TEST ZONE */
import { chainflow } from '../core/chainflow';
import { InputNodes } from '../core/endpoint';
import { link } from '../utils/inputs';
import {
  createProject,
  createRole,
  createSubmission,
  createUser,
  getSubmission,
  getUser,
} from './setup';

// create the chains
getUser.set(({ query: { age } }: InputNodes) => {
  link(age, createUser.resp.details.age);
});

createRole.set(({ body: { userId } }: InputNodes) => {
  link(userId, createUser.resp.id);
});

createProject.set(({ body: { creatorId } }: InputNodes) => {
  link(creatorId, createUser.resp.id);
});

createSubmission.set(({ body: { creatorId, projectId } }: InputNodes) => {
  link(creatorId, createUser.resp.id);
  link(projectId, createProject.resp.id);
});

getSubmission.set(({ pathParams: { submissionId } }) => {
  link(submissionId, createSubmission.resp.id);
});

// run the chainflows
const chain = chainflow();
chain
  .call(createUser)
  .call(createRole)
  .call(createProject)
  .call(createSubmission)
  .call(getSubmission)
  .run();
