# Chainflow

## Goal

Manage dynamically generated datasets/payloads that can be used to call endpoints.

Payload chaining to complete a series of actions in a business-centric manner.

## Use Cases

1. Simulate frontend interaction flow with backend APIs
2. Seeding a database with business logic for demo purposes
3. Testing variations of inputs on endpoints

## Basic Usage

Define your endpoints and their request/response signatures.

`definitions.ts`

```typescript
// Define API signatures
export const userPost = endpoint('POST', '/user').body({
  name: 'Tom',
  details: {
    age: 40,
  },
});

export const rolePost = endpoint('POST', '/role').body({
  type: 'Engineer',
  userId: '',
});

export const userGet = endpoint('GET', '/user').query({
  roleType: '',
});
```

Use `link` to pass values from a response into a future request.

`chains.ts`

```typescript
// generate route objects
import { generateRoutes, link } from chainflow;
import * as definitions from 'definitions';

const { user, role } = generateRoutes(definitions, '127.0.0.1', '5000');

/// Create endpoint chains
role.post.set(({ body: { userId }}) => {
  link(userId, user.post.resp.id); // link `id` from `POST /user` response to `userId`
});

user.get.set(({ query: { roleType } }) => {
  link(roleType, role.post.resp.type); // link `type` from `POST /role` response to `roleType` 
})

export { user, role };
```

Define the sequence of endpoint calls which makes endpoint requests based on the given default values as well as linked values from responses received during the flow.

`flows.ts`

```typescript
/// Create workflows that take advantage of chains
import { chainflow } from Chainflow;
import { user, role } from 'chains';

const flow = chainflow();
flow.post(user).post(role).get(user).run();
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
     "userId": "[[userId from response to step 1]]",
   }
   ```

3. `GET` Request to `/user?roleType=[[type from response to step 2]]`

## Advanced Features

The request payloads under `Basic Usage` are defined with only _default_ values - i.e. the values which a Chainflow use if there are no response values from other endpoint calls linked to it.

However, you can also use the following features to more flexibly define the values used in a request.

### `valPool`

Define a pool of values to take from when building requests.

```typescript
export const userPost = endpoint('POST', '/user').body({
  name: valPool(['Tom', 'Harry', 'Jane']),
  details: {
    age: 40,
  },
});
```

### `valGen`

Define a callback that produces values for building requests.

```typescript
export const userPost = endpoint('POST', '/user').body({
  name: 'Tom',
  details: {
    age: valGen(() => Math.floor(Math.random() * 100)),
  },
});
```
