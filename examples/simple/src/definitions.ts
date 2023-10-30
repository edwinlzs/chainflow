import { endpointFactory } from 'chainflow';

const factory = endpointFactory('127.0.0.1:3001');

// Defining API signatures
export const createUser = factory.post('/user').body({
  name: 'user-name',
  details: {
    age: 42,
  },
});

export const getUser = factory.get('/user').query({
  age: 42,
});

// Role
export const createRole = factory.post('/role').body({
  user_id: 'role-user_id',
  type: 'role-type',
});

// Project
export const createProject = factory.post('/project').body({
  creator_id: 'project-user_id',
  details: {
    title: 'project-title',
    type: 'project-type',
  },
});

// Submission
export const createSubmission = factory.post('/submission').body({
  creator_id: 'submission-user_id',
  project_id: 'submission-project_id',
});

export const getSubmission = factory.get('/submission/{submissionId}');
