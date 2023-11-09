# Chainflow

Create dynamic and flexible workflows of API calls by linking outputs from one call to the input of another.

## Use Cases

1. Set up demo data
2. Simulate frontend interactions with backend APIs
3. Test edge cases on endpoints with input variations

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

Use the `set` method to expose an endpoint's input nodes.  
Use the `link` helper to pass values from a response into a future request.

```typescript
import { generateRoutes, link } from chainflow;

createRole.set(({ body: { userId }}) => {
  link(userId, createUser.resp.id); // link `id` from `POST /user` response to `userId`
});

getUser.set(({ query: { roleType } }) => {
  link(roleType, createRole.resp.type); // link `type` from `POST /role` response to `roleType`
});
```

Use a `chainflow` to define a sequence of endpoint calls that take advantage of the values and links provided above.

```typescript
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
     "userId": "['userId' from response to step 1]"
   }
   ```

3. `GET` Request to `/user?roleType=['type' from response to step 2]`

## More Features

The request payloads under `Basic Usage` are defined with only _default_ values - i.e. the values which a Chainflow use if there are no response values from other endpoint calls linked to it.

However, you can also use the following features to more flexibly define the values used in a request.

### `pool`

Define a pool of values to take from when building requests.

```typescript
const userPost = factory.post('/user').body({
  name: pool(['Tom', 'Harry', 'Jane']),
  details: {
    age: 40,
  },
});
```

### `gen`

Define a callback that produces values for building requests.

```typescript
const userPost = factory.post('/user').body({
  name: 'Tom',
  details: {
    age: gen(() => Math.floor(Math.random() * 100)),
  },
});
```

### `linkMany`

Link multiple response values to a single request node, providing a callback to transform the values into a single output.

```typescript
const mergeValues = ({
  userName,
  favAnimal,
}: {
  userName: string;
  favAnimal: string;
}) => `${userName} likes ${favAnimal}.`;

createNotification.set(({ body: { msg } }) => {
  linkMany(
    msg, // the request node
    // specify which response nodes to take values from and assigns them to a key
    {
      userName: getUser.resp.name,
      favAnimal: getFavAnimal.resp.favAnimal,
    },
    // callback that takes the response values as its argument
    // and returns a single output value for the request node
    mergeValues, 
  );
});
```

## Development

Run specific test files:

`pnpm run test:file ./src/**/chainflow.test.ts`
