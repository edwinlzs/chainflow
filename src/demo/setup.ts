/** TEST ZONE */

import { Endpoint } from '../core/endpoint';
import { Route } from '../core/route';

// this section should be derived by the lib from API specs
// or from utility functions placed within defined routes
// to capture input/output payloads

// User
const userPostRequest = {
  name: 'user - name',
  details: {
    age: 42,
  },
};

const userPostResponse = {
  id: 'user - user_id',
};

const userPost = new Endpoint({ route: '/user', method: 'POST' });
userPost.req = userPostRequest;
userPost.res = userPostResponse;
const user = new Route({ post: userPost });

// Role
const rolePostRequest = {
  id: 'role - user_id',
  type: 'role - type',
};

const rolePostResponse = {};

const rolePost = new Endpoint({ route: '/role', method: 'POST' });
rolePost.req = rolePostRequest;
rolePost.res = rolePostResponse;
const role = new Route({ post: rolePost });

// Project
const projectPostRequest = {
  creator_id: 'project - user_id',
  details: {
    title: 'project - title',
    type: 'project - type',
  },
};

const projectPostResponse = {
  id: 'project - id',
};

const projectPost = new Endpoint({ route: '/project', method: 'POST' });
projectPost.req = projectPostRequest;
projectPost.res = projectPostResponse;
const project = new Route({ post: projectPost });

// Submission
const submissionPostRequest = {
  creator_id: 'submission - user_id',
  project_id: 'submission - project_id',
};

const submissionPostResponse = {
  id: 'submission - id',
};

const submissionPost = new Endpoint({ route: '/submission', method: 'POST' });
submissionPost.req = submissionPostRequest;
submissionPost.res = submissionPostResponse;
const submission = new Route({ post: submissionPost });

export { user, role, project, submission };
