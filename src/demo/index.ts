/** USER TEST ZONE */
import { chainflow } from '../core/chainflow.js';
import { InputNodes } from '../core/endpoint.js';
import { project, role, submission, user } from './setup.js';

// create the chains
user.get.set((link, { query: { age } }: InputNodes) => {
  link(age, user.post.res.details.age);
});

role.post.set((link, { body: { user_id } }: InputNodes) => {
  link(user_id, user.post.res.id);
});

project.post.set((link, { body: { creator_id } }: InputNodes) => {
  link(creator_id, user.post.res.id);
});

submission.post.set((link, { body: { creator_id, project_id } }: InputNodes) => {
  link(creator_id, user.post.res.id);
  link(project_id, project.post.res.id);
});

submission.get.set((link, { pathParams: { submissionId } }) => {
  link(submissionId, submission.post.res.id);
});

// run the chainflows
const chain = chainflow();
chain.post(user).post(role).post(project).post(submission).get(submission).run();
