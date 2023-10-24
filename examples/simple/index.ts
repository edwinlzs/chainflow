import { chainflow, InputNodes, link } from 'chainflow';
import { project, role, submission, user } from './src/definitions';

// create the chains
user.get.set(({ query: { age } }: InputNodes) => {
  link(age, user.post.resp.details.age);
});

role.post.set(({ body: { user_id } }: InputNodes) => {
  link(user_id, user.post.resp.id);
});

project.post.set(({ body: { creator_id } }: InputNodes) => {
  link(creator_id, user.post.resp.id);
});

submission.post.set(({ body: { creator_id, project_id } }: InputNodes) => {
  link(creator_id, user.post.resp.id);
  link(project_id, project.post.resp.id);
});

submission.get.set(({ pathParams: { submissionId } }) => {
  link(submissionId, submission.post.resp.id);
});

console.log("Running chainflows");

// run the chainflows
const chain = chainflow();
chain.post(user).get(user).post(role).post(project).post(submission).get(submission).run();