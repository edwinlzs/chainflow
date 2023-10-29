import { endpoint, route } from 'chainflow';

const addr = '127.0.0.1:3001';

// Defining API signatures
const userPost = endpoint('POST', '/user').body({
  name: 'user-name',
  details: {
    age: 42,
  },
});

const userGet = endpoint('GET', '/user').query({
  age: 42,
});
const user = route([userPost, userGet], addr);

// Role
const rolePost = endpoint('POST', '/role').body({
  user_id: 'role-user_id',
  type: 'role-type',
});
const role = route([rolePost], addr);

// Project
const projectPost = endpoint('POST', '/project').body({
  creator_id: 'project-user_id',
  details: {
    title: 'project-title',
    type: 'project-type',
  },
});
const project = route([projectPost], addr);

// Submission
const submissionPost = endpoint('POST', '/submission').body({
  creator_id: 'submission-user_id',
  project_id: 'submission-project_id',
});

const submissionGet = endpoint('GET', '/submission/{submissionId}');
const submission = route([submissionPost, submissionGet], addr);

export { user, role, project, submission };
