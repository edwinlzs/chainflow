/** TEST ZONE */
import { endpointFactory } from '../http/endpointFactory';

// this section should be derived by the lib from API specs
// or from utility functions placed within defined routes
// to capture input/output payloads

const factory = endpointFactory('127.0.0.1:5000');

// User
const userPostRequest = {
  name: 'user-name',
  details: {
    age: 42,
  },
};

export const createUser = factory.post('/user').body(userPostRequest);

const userQuery = {
  age: 42,
};

export const getUser = factory.get('/user').query(userQuery);

// Role
const rolePostRequest = {
  userId: 'role-userId',
  type: 'role-type',
};

export const createRole = factory.post('/role').body(rolePostRequest);

// Project
const projectPostRequest = {
  creatorId: 'project-userId',
  details: {
    title: 'project-title',
    type: 'project-type',
  },
};

export const createProject = factory.post('/project').body(projectPostRequest);

// Submission
const submissionPostRequest = {
  creatorId: 'submission-userId',
  projectId: 'submission-projectId',
};

export const createSubmission = factory.post('/submission').body(submissionPostRequest);

export const getSubmission = factory.get('/submission/{submissionId}');
