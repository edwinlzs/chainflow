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

interface IUserPostResponse {
  id: string,
  name: string,
  details: {
    age: number,
  },
}

const userPost = new Endpoint({ path: '/user', method: 'POST' }).body(userPostRequest);
// userPost.resp = userPostResponse;

const userQuery = {
  age: 42,
};

const userGet = new Endpoint({ path: '/user', method: 'GET' });
userGet.query(userQuery);
// userGet.resp = userPostResponse;

const user = new Route([userPost, userGet]);

// Role
const rolePostRequest = {
  userId: 'role-userId',
  type: 'role-type',
};

const rolePostResponse = {};

const rolePost = new Endpoint({ path: '/role', method: 'POST' }).body(rolePostRequest);
// rolePost.resp = rolePostResponse;
const role = new Route([rolePost]);

// Project
const projectPostRequest = {
  creatorId: 'project-userId',
  details: {
    title: 'project-title',
    type: 'project-type',
  },
};

const projectPostResponse = {
  id: 'project-projectId',
};

const projectPost = new Endpoint({ path: '/project', method: 'POST' }).body(projectPostRequest);
// projectPost.resp = projectPostResponse;
const project = new Route([projectPost]);

// Submission
const submissionPostRequest = {
  creatorId: 'submission-userId',
  projectId: 'submission-projectId',
};

const submissionPostResponse = {
  id: 'submission-id',
};

const submissionPost = new Endpoint({ path: '/submission', method: 'POST' }).body(
  submissionPostRequest,
);
// submissionPost.resp = submissionPostResponse;

const submissionGetResponse = {
  id: 'submission-id',
  name: 'submission-name',
};

const submissionGet = new Endpoint({ path: '/submission/{submissionId}', method: 'GET' });
// submissionPost.resp = submissionGetResponse;
const submission = new Route([submissionPost, submissionGet]);

export { user, role, project, submission };
