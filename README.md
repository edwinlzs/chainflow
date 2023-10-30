# Chainflow

## Goal

Manage dynamically generated datasets/payloads that can be used to call endpoints.

Payload chaining to complete a series of actions in a business-centric manner.

## Use Cases

1. Simulate frontend interaction flow with backend APIs
2. Seeding a database with business logic for demo purposes
3. Testing variations of inputs on endpoints

## Basic Usage

Use `endpointFactory` to define your endpoints and their request/response signatures with the `endpoint` method.

```typescript
import { endpointFactory } from chainflow;

const factory = endpointFactory('127.0.0.1:5000');

const createUser = factory.post('/user').body({
  name: 'Tom',
  details: {
    age: 40,
  },
});

const createRole = factory.post('/role').body({
  type: 'Engineer',
  userId: '',
});

const getUser = factory.get('/user').query({
  roleType: '',
});
```

Use `link` to pass values from a response into a future request.

```typescript
import { generateRoutes, link } from chainflow;

/// Create endpoint chains
createRole.set(({ body: { userId }}) => {
  link(userId, createUser.resp.id); // link `id` from `POST /user` response to `userId`
});

getUser.set(({ query: { roleType } }) => {
  link(roleType, createRole.resp.type); // link `type` from `POST /role` response to `roleType`
});
```

Use methods on `chainflow` to define the sequence of endpoint requests built with the given default values or linked values from earlier responses received during the flow.

```typescript
/// Create workflows that take advantage of chains
import { chainflow } from Chainflow;

const flow = chainflow()
  .call(createUser)
  .call(createRole)
  .call(getUser);

flow.run();
```

---

\
The above setup will result in the following API calls:

1. `POST` Request to `/user` with body:

   ```json
   {
     "name": "Tom",
     "details": {
       "age": 40
     }
   }
   ```

2. `POST` Request to `/role` with body:

   ```json
   {
     "type": "Engineer",
     "userId": "[[(userId) from response to step 1]]"
   }
   ```

3. `GET` Request to `/user?roleType=[[(type) from response to step 2]]`

## Advanced Features

The request payloads under `Basic Usage` are defined with only _default_ values - i.e. the values which a Chainflow use if there are no response values from other endpoint calls linked to it.

However, you can also use the following features to more flexibly define the values used in a request.

### `valPool`

Define a pool of values to take from when building requests.

```typescript
const userPost = factory.post('/user').body({
  name: valPool(['Tom', 'Harry', 'Jane']),
  details: {
    age: 40,
  },
});
```

### `valGen`

Define a callback that produces values for building requests.

```typescript
const userPost = factory.post('/user').body({
  name: 'Tom',
  details: {
    age: valGen(() => Math.floor(Math.random() * 100)),
  },
});
```

## Development

Run specific test files:

`pnpm run test:file ./src/**/chainflow.test.ts`
