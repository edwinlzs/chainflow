/** USER TEST ZONE */
import { chainflow } from '../core/chainflow.js';
import { ReqNodes } from '../core/endpoint.js';
import { project, role, submission, user } from './setup.js';

// create the chains
role.post.set((link, { id }: ReqNodes) => {
  link(id, user.post.res.id);
});

project.post.set((link, { creator_id }: ReqNodes) => {
  link(creator_id, user.post.res.id);
});

submission.post.set((link, { creator_id, project_id }: ReqNodes) => {
  link(creator_id, user.post.res.id);
  link(project_id, project.post.res.id);
});

// run the chainflows
const chain = chainflow();
chain.post(user).post(role).post(project).post(submission).run();
