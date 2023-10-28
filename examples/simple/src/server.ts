import express from 'express';

const PORT = 3001;

const app = express();
app.use(express.json());

app.post('/user', (req, res) => {
  console.log(`Received POST call at /user with body: ${JSON.stringify(req.body)}`);
  res.send({
    id: 'user-user_id',
    ...req.body,
  });
});

app.get('/user', (req, res) => {
  console.log(`Received GET call at /user with query: ${JSON.stringify(req.query, null, 2)}`);
  res.send({
    id: 'user-user_id',
    name: 'user-name',
    details: {
      age: 42,
    },
  });
});

app.post('/role', (req, res) => {
  console.log(`Received POST call at /role with body: ${JSON.stringify(req.body)}`);
  res.send({
    user_id: 'role-user_id',
    type: 'role-type',
  });
});

app.post('/project', (req, res) => {
  console.log(`Received POST call at /project with body: ${JSON.stringify(req.body)}`);
  res.send({
    id: 'project-project_id',
  });
});

app.post('/submission', (req, res) => {
  console.log(`Received POST call at /submission with body: ${JSON.stringify(req.body)}`);
  res.send({
    id: 'submission-submission_id',
  });
});

// this route has a `submissionId` param in its path
app.get('/submission/:submissionId', (req, res) => {
  console.log(`Received GET call at /submission with path: ${req.path}`);
  res.send({
    id: 'submission-submission_id',
    name: 'submission-submission_name',
  });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});