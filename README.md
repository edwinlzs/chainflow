# Goal

Manage dynamically generated datasets/payloads that can be used to call endpoints.

Payload chaining to complete a series of actions in a business-centric manner.

# Tasks

- [ ] Unit Tests
- [ ] Param Handling
- [ ] Endpoint Call Opts
- [ ] Headers Handling
- [ ] Cookies Handling
- [ ] Github Actions
- [ ] OS License

# Use Case

### Examples

Example of a chain

1. Create User 1 (POST `/user`)
2. Assign Role 1 (POST `/role`) with User 1
3. Create Project 1 (POST `/project`) with User 1
4. Create Project 2 (POST `/project`) with User 1
5. Create Submission 1 (POST `/submission`) with Project 1, User 1
6. Create Submission 2 (POST `/submission`) with Project 2, User 1

# Code

`links.ts`

```typescript
// generate route objects
import { generateRoutes } from Chainflow;

const { role, project, submission } = generateRoutes();

/// Set up links between endpoints
role.post.set(function ({ name, type }) {
  link(name, user.post.res.name); // name should now be passed from user to role
  assign(type, ["ENGINEER", "ARCHITECT", "BUILDER"]); // type will be randomly selected from value pool
});

project.post.set(function ({ createdBy }) {
  link(createdBy, user.post.res.name);
});

submission.post.set(function ({ projectId, details: { createdBy } }) {
  link(projectId, project.post.res.id);
  link(createdBy, user.post.res.name);
});

export { role, project, submission };
```

`workflows.ts`

```typescript
/// Create workflows that take advantage of chain links
import { chainflow } from Chainflow;

const chain = chainflow();

chain.post(user).post(role).post(project, { count: 2 }).post(submission).run();
```

# Caveats

Payloads used with this lib are unable to contain keys with the name `_setSource` or `_getNodeValue` as these are currently reserved for lib operations.
