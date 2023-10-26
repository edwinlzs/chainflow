/** TEST ZONE */
import { Endpoint } from '../core/endpoint';
import { Route } from '../core/route';

// this section should be derived by the lib from API specs
// or from utility functions placed within defined routes
// to capture input/output payloads

// User
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

const userGet = new Endpoint({ path: '/user', method: 'GET' });
userGet.query(userQuery);

const user = new Route([userPost, userGet]);

// Role
const rolePostRequest = {
  userId: 'role-userId',
  type: 'role-type',
};

const rolePost = new Endpoint({ path: '/role', method: 'POST' }).body(rolePostRequest);
const role = new Route([rolePost]);

// Project
const projectPostRequest = {
  creatorId: 'project-userId',
  details: {
    title: 'project-title',
    type: 'project-type',
  },
};

const projectPost = new Endpoint({ path: '/project', method: 'POST' }).body(projectPostRequest);
const project = new Route([projectPost]);

// Submission
const submissionPostRequest = {
  creatorId: 'submission-userId',
  projectId: 'submission-projectId',
};

const submissionPost = new Endpoint({ path: '/submission', method: 'POST' }).body(
  submissionPostRequest,
);

const submissionGet = new Endpoint({ path: '/submission/{submissionId}', method: 'GET' });
const submission = new Route([submissionPost, submissionGet]);

export { user, role, project, submission };
