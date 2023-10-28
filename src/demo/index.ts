/** USER TEST ZONE */
import { chainflow } from '../core/chainflow';
import { InputNodes } from '../core/endpoint';
import { link } from '../utils/inputs';
import { project, role, submission, user } from './setup';

// create the chains
user.get.set(({ query: { age } }: InputNodes) => {
  link(age, user.post.resp.details.age);
});

role.post.set(({ body: { userId } }: InputNodes) => {
  link(userId, user.post.resp.id);
});

project.post.set(({ body: { creatorId } }: InputNodes) => {
  link(creatorId, user.post.resp.id);
});

submission.post.set(({ body: { creatorId, projectId } }: InputNodes) => {
  link(creatorId, user.post.resp.id);
  link(projectId, project.post.resp.id);
});

submission.get.set(({ pathParams: { submissionId } }) => {
  link(submissionId, submission.post.resp.id);
});

// run the chainflows
const chain = chainflow();
chain.post(user).post(role).post(project).post(submission).get(submission).run();
