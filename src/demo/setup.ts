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

const userPostResponse = {
  id: 'user-user_id',
  ...userPostRequest,
};

const userPost = new Endpoint({ path: '/user', method: 'POST' });
userPost.body = userPostRequest;
userPost.resp = userPostResponse;

const userQuery = {
  age: 42,
};

const userGet = new Endpoint({ path: '/user', method: 'GET' });
userGet.query = userQuery;
userGet.resp = userPostResponse;

const user = new Route([userPost, userGet]);

// Role
const rolePostRequest = {
  user_id: 'role-user_id',
  type: 'role-type',
};

const rolePostResponse = {};

const rolePost = new Endpoint({ path: '/role', method: 'POST' });
rolePost.body = rolePostRequest;
rolePost.resp = rolePostResponse;
const role = new Route([rolePost]);

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
projectPost.resp = projectPostResponse;
const project = new Route([projectPost]);

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
submissionPost.resp = submissionPostResponse;

const submissionGetResponse = {
  id: 'submission-id',
  name: 'submission-name',
};

const submissionGet = new Endpoint({ path: '/submission/{submissionId}', method: 'GET' });
submissionGet.body = {};
submissionPost.resp = submissionGetResponse;
const submission = new Route([submissionPost, submissionGet]);

export { user, role, project, submission };
