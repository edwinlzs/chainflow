/** TEST ZONE */
import { Endpoint, endpoint } from '../core/endpoint';
import { Route, route } from '../core/route';

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

const userPost = endpoint('POST', '/user').body(userPostRequest);

const userQuery = {
  age: 42,
};

const userGet = endpoint('GET', '/user');
userGet.query(userQuery);

const user = route([userPost, userGet]);

// Role
const rolePostRequest = {
  userId: 'role-userId',
  type: 'role-type',
};

const rolePost = endpoint('POST', '/role').body(rolePostRequest);
const role = route([rolePost]);

// Project
const projectPostRequest = {
  creatorId: 'project-userId',
  details: {
    title: 'project-title',
    type: 'project-type',
  },
};

const projectPost = endpoint('POST', '/project').body(projectPostRequest);
const project = route([projectPost]);

// Submission
const submissionPostRequest = {
  creatorId: 'submission-userId',
  projectId: 'submission-projectId',
};

const submissionPost = endpoint('POST', '/submission').body(submissionPostRequest);

const submissionGet = endpoint('GET', '/submission/{submissionId}');
const submission = route([submissionPost, submissionGet]);

export { user, role, project, submission };
