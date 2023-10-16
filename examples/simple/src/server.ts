import express from 'express';

const app = express;
const port = 3001;

app.post('/user', (req, res) => {
  console.log(`Received POST call at /user with body: ${JSON.stringify(req.body, null, 2)}`);
  res.send({
    id: 'user - user_id',
    ...req.body,
  });
});

app.get('/user', (req, res) => {
  console.log(`Received GET call at /user with query: ${req.query}`);
  res.send({
    id: 'user-user_id',
    name: 'user-name',
    details: {
      age: 42,
    },
  });
});

app.post('/role', (req, res) => {
  console.log(`Received POST call at /role with body: ${JSON.stringify(req.body, null, 2)}`);
  res.send({
    user_id: 'role-user_id',
    type: 'role-type',
  });
});

app.post('/project', (req, res) => {
  console.log(`Received POST call at /project with body: ${JSON.stringify(req.body, null, 2)}`);
  res.send({
    id: 'project-project_id',
  });
});

app.post('/submission', (req, res) => {
  console.log(`Received POST call at /submission with body: ${JSON.stringify(req.body, null, 2)}`);
  res.send({
    creator_id: 'submission-user_id',
    project_id: 'submission-project_id',
  });
});

app.get('/submission/{submissionId}', (req, res) => {
  console.log(`Received GET call at /submission with path: ${req.path}`);
  res.send({
    id: 'submission-id',
    name: 'submission-name',
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});