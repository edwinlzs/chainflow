import { Endpoint, Route } from 'chainflow';

// Defining API signatures
const userPostRequest = {
  name: 'user-name',
  details: {
    age: 42,
  },
};

const userPostResponse = {
  id: 'user-user_id',
  ...userPostRequest,
};

const userPost = new Endpoint({ path: '/user', method: 'POST' });
userPost.body = userPostRequest;
userPost.res = userPostResponse;

const userQuery = {
  age: 42,
};

const userGet = new Endpoint({ path: '/user', method: 'GET' });
userGet.query = userQuery;
userGet.res = userPostResponse;

const user = new Route([userPost, userGet], '127.0.0.1:3001');

// Role
const rolePostRequest = {
  user_id: 'role-user_id',
  type: 'role-type',
};

const rolePostResponse = {};

const rolePost = new Endpoint({ path: '/role', method: 'POST' });
rolePost.body = rolePostRequest;
rolePost.res = rolePostResponse;
const role = new Route([rolePost], '127.0.0.1:3001');

// Project
const projectPostRequest = {
  creator_id: 'project-user_id',
  details: {
    title: 'project-title',
    type: 'project-type',
  },
};

const projectPostResponse = {
  id: 'project-project_id',
};

const projectPost = new Endpoint({ path: '/project', method: 'POST' });
projectPost.body = projectPostRequest;
projectPost.res = projectPostResponse;
const project = new Route([projectPost], '127.0.0.1:3001');

// Submission
const submissionPostRequest = {
  creator_id: 'submission-user_id',
  project_id: 'submission-project_id',
};

const submissionPostResponse = {
  id: 'submission-id',
};

const submissionPost = new Endpoint({ path: '/submission', method: 'POST' });
submissionPost.body = submissionPostRequest;
submissionPost.res = submissionPostResponse;

const submissionGetResponse = {
  id: 'submission-id',
  name: 'submission-name',
};

const submissionGet = new Endpoint({ path: '/submission/{submissionId}', method: 'GET' });
submissionGet.body = {};
submissionPost.res = submissionGetResponse;
const submission = new Route([submissionPost, submissionGet], '127.0.0.1:3001');

export { user, role, project, submission }
