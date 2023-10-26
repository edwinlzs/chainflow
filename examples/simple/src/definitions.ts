import { Endpoint, Route } from 'chainflow';

// Defining API signatures
const userPostRequest = {
  name: 'user-name',
  details: {
    age: 42,
  },
};

const userPost = new Endpoint({ path: '/user', method: 'POST' }).body(userPostRequest);

const userQuery = {
  age: 42,
};

const userGet = new Endpoint({ path: '/user', method: 'GET' }).query(userQuery);
const user = new Route([userPost, userGet], '127.0.0.1:3001');

// Role
const rolePostRequest = {
  user_id: 'role-user_id',
  type: 'role-type',
};

const rolePost = new Endpoint({ path: '/role', method: 'POST' }).body(rolePostRequest);
const role = new Route([rolePost], '127.0.0.1:3001');

// Project
const projectPostRequest = {
  creator_id: 'project-user_id',
  details: {
    title: 'project-title',
    type: 'project-type',
  },
};

const projectPost = new Endpoint({ path: '/project', method: 'POST' }).body(projectPostRequest);
const project = new Route([projectPost], '127.0.0.1:3001');

// Submission
const submissionPostRequest = {
  creator_id: 'submission-user_id',
  project_id: 'submission-project_id',
};

const submissionPost = new Endpoint({ path: '/submission', method: 'POST' }).body(
  submissionPostRequest,
);

const submissionGet = new Endpoint({ path: '/submission/{submissionId}', method: 'GET' });
const submission = new Route([submissionPost, submissionGet], '127.0.0.1:3001');

export { user, role, project, submission };
