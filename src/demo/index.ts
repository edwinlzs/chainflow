/** USER TEST ZONE */
import { chainflow } from '../core/chainflow';
import { link } from '../core/utils/link';
import { HttpInputNodes } from '../http/endpoint';
import {
  createProject,
  createRole,
  createSubmission,
  createUser,
  getSubmission,
  getUser,
} from './setup';

// create the chains
getUser.set(({ query: { age } }: HttpInputNodes) => {
  link(age, createUser.resp.body.details.age);
});

createRole.set(({ body: { userId } }: HttpInputNodes) => {
  link(userId, createUser.resp.body.id);
});

createProject.set(({ body: { creatorId } }: HttpInputNodes) => {
  link(creatorId, createUser.resp.body.id);
});

createSubmission.set(({ body: { creatorId, projectId } }: HttpInputNodes) => {
  link(creatorId, createUser.resp.body.id);
  link(projectId, createProject.resp.body.id);
});

getSubmission.set(({ pathParams: { submissionId } }) => {
  link(submissionId, createSubmission.resp.body.id);
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
