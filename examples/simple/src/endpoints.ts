import { link, origin } from 'chainflow';

const backend = origin('127.0.0.1:3001');

// Defining API signatures
export const createUser = backend.post('/user').body({
  name: 'user-name',
  details: {
    age: 42,
  },
});

export const getUser = backend.get('/user').query({
  age: createUser.resp.body.details.age,
});

// Role
export const createRole = backend.post('/role').body({
  user_id: createUser.resp.body.id,
  type: 'role-type',
});

// Project
export const createProject = backend.post('/project').body({
  creator_id: createUser.resp.body.id,
  details: {
    title: 'project-title',
    type: 'project-type',
  },
});

// Submission
export const createSubmission = backend.post('/submission').body({
  creator_id: createUser.resp.body.id,
  project_id: createProject.resp.body.id,
});

export const getSubmission = backend.get('/submission/{submissionId}');

getSubmission.set(({ pathParams: { submissionId } }) => {
  link(submissionId, createSubmission.resp.body.id);
});