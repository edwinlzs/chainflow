# Chainflow

Chainflow is a library for creating dynamic and flexible API call workflows by linking outputs from one call to the inputs of another.

## Use Cases

1. Set up demo data
2. Simulate frontend interactions with backend APIs
3. Test edge cases on endpoints with input variations

## Basic Usage

```console
npm install --save-dev chainflow
```

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

&nbsp;

## More Features

### Path params

Define path params by wrapping a param name with `{}` in the endpoint path.

```typescript
const getGroupsWithUser = factory.get('/groups/{userId}');
```

### Query params

Define query params with the `query` method on an endpoint.

```typescript
const getUsersInGroup = factory.get('/user').query({ groupId: 'some-id' });
```

### Headers

Specify headers with `headers` method on endpoints.

```typescript
const getInfo = factory.get('/info').headers({ token: 'some-token' });
```

You can also use `headers` on an `EndpointFactory` to have all endpoints made from that factory bear those headers.

```typescript
const factory = endpointFactory('127.0.0.1:3001').headers({ token: 'some-token' });

const getInfo = factory.get('/info'); // getInfo endpoint will have the headers defined above
```

The request payloads under `Basic Usage` are defined with only _default_ values - i.e. the values which a Chainflow use if there are no response values from other endpoint calls linked to it.

However, you can also use the following features to more flexibly define the values used in a request.

### `required`

Marks a value as required but without a default. The chainflow will expect this value to be sourced from another node. If no such source is available, the endpoint call will throw an error.

```typescript
const createUser = factory.post('/user').body({
  name: required(),
});
```

### `pool`

Provide a pool of values to take from when building requests. By default, Chainflow will randomly choose a value from the pool for each call in a non-exhaustive manner.

```typescript
const userPost = factory.post('/user').body({
  name: pool(['Tom', 'Harry', 'Jane']),
  details: {
    age: 40,
  },
});
```

### `gen`

Provide a callback that generates values for building requests.

```typescript
const randAge = () => Math.floor(Math.random() * 100);

const userPost = factory.post('/user').body({
  name: 'Tom',
  details: {
    age: gen(randAge),
  },
});
```

### `linkMany`

Link multiple response values to a single request node, providing a callback to transform the values into a single output.

```typescript
const mergeValues = ({ userName, favAnimal }: { userName: string; favAnimal: string }) =>
  `${userName} likes ${favAnimal}.`;

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

### Call Options

You can declare manual values for an endpoint call in the chainflow itself, should you need to do so, by passing in a Call Options object as a second argument in the `call` method.

`body`, `pathParams`, `query` and `headers` can be set this way.

```typescript
const createUser = factory.post('/user').body({
  name: 'Tom',
});

chainflow()
  .call(createUser, { body: { name: 'Harry' } })
  .run();
```

&nbsp;

## Future Updates

Below features are currently not yet supported but are planned in future releases.

1. Content types other than `application/json`
2. HTTPS
3. Cookies

## Development

Run specific test files:

`pnpm run test:file ./src/**/chainflow.test.ts`
