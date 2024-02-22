<h1 align="center" style="border-bottom: none;">🌊hainflow</h1>
<h3 align="center">A library to create dynamic and composable API call workflows.</h3>
<div align="center">
  
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/edwinlzs/chainflow/blob/main/LICENSE)
&nbsp;
[![NPM version](https://img.shields.io/npm/v/chainflow.svg?style=flat-square)](https://www.npmjs.com/package/chainflow)
&nbsp;
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/edwinlzs/chainflow/on-push.yml?style=flat-square&branch=main)](https://github.com/edwinlzs/chainflow/actions)
&nbsp;
</div>

## Not Released Yet

Hi! If you are here, you're a bit early. I'm still setting up some stuff for the first release. Check back in later!

## Documentation

Read the guides over at <https://edwinlzs.github.io/chainflow-docs/> to get started!

## Use Cases

Create multiple sets of API call workflows with this library that can be used to:

1. Insert demo data via your app's APIs (instead of SQL/db scripts)
2. Simulate frontend interactions with backend APIs
3. UI-agnostic end-to-end testing of backend APIs
4. Test edge cases on backend endpoints with input variations

## Basic Usage

```console
npm install --save-dev chainflow
```

Use `originServer` to define your endpoints and their request/response signatures with the `endpoint` method.

```typescript
import { originServer } from chainflow;

const origin = originServer('127.0.0.1:5000');

const createUser = origin.post('/user').body({
  name: 'Tom',
  details: {
    age: 40,
  },
});

const createRole = origin.post('/role').body({
  type: 'Engineer',
  userId: createUser.resp.body.id,
});

const getUser = origin.get('/user').query({
  roleType: createRole.resp.body.type,
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
const getGroupsWithUser = origin.get('/groups/{userId}');
```

### Query params

Define query params with the `query` method on an endpoint.

```typescript
const getUsersInGroup = origin.get('/user').query({ groupId: 'some-id' });
```

### Headers

Specify headers with `headers` method on endpoints.

```typescript
const getInfo = origin.get('/info').headers({ token: 'some-token' });
```

You can also use `headers` on an `OriginServer` to have all endpoints made for that origin bear those headers.

```typescript
const origin = originServer('127.0.0.1:3001').headers({ token: 'some-token' });

const getInfo = origin.get('/info'); // getInfo endpoint will have the headers defined above
```

The request payloads under `Basic Usage` are defined with only _default_ values - i.e. the values which a Chainflow use if there are no response values from other endpoint calls linked to it.

However, you can also use the following features to more flexibly define the values used in a request.

### `required`

Marks a value as required but without a default. The chainflow will expect this value to be sourced from another node. If no such source is available, the endpoint call will throw an error.

```typescript
const createUser = origin.post('/user').body({
  name: required(),
});
```

### [_EXPERIMENTAL_] - `pool`

Provide a pool of values to take from when building requests. By default, Chainflow will randomly choose a value from the pool for each call in a non-exhaustive manner.

```typescript
const createUser = origin.post('/user').body({
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

const createUser = origin.post('/user').body({
  name: 'Tom',
  details: {
    age: gen(randAge),
  },
});
```

### `source`

Specify a source node with a callback.

```typescript
const addGreeting = (name: string) => `Hello ${name}`;

createNotification.body({
  msg: source(getUser.resp.body.name, addGreeting);
});
```

### `sources`

Specify multiple source nodes that a value can be taken from, with an optional callback.

```typescript
createNotification.body({
  msg: sources([getUser.resp.body.name, createUser.resp.body.name], addGreeting);
});
```

### `link`

Link a response values to a single request node.

```typescript
createNotification.set(({ body: { msg } }) => {
  link(msg, getUser.resp.body.name);
});
```

Optionally, you can pass a callback to transform the response value before it is passed to the node.

```typescript
createNotification.set(({ body: { msg } }) => {
  link(msg, getUser.resp.body.name, addGreeting);
});
```

### `linkMerge`

Link multiple response values to a single request node with an optional callback to merge the values into a single input value.

For the second argument, you can either pass an array of SourceNodes:

```typescript
const mergeValues = ([name, favAnimal]: [string, string]) =>
  `${name} likes ${favAnimal}.`;

createNotification.set(({ body: { msg } }) => {
  linkMerge(
    msg, // the request node
    // specify which source nodes to take values from
    [getUser.resp.body.name, favAnimal: getFavAnimal.resp.body.favAnimal],
    // callback that takes the source values as its argument
    // and returns a single output value for the request node
    // callback parameter should look like an array of source values
    mergeValues,
  );
});
```

or you can pass an object with SourceNodes as the values:

```typescript
const mergeValues = ({ userName, favAnimal }: { userName: string; favAnimal: string }) =>
  `${userName} likes ${favAnimal}.`;

createNotification.set(({ body: { msg } }) => {
  linkMerge(
    msg,
    // specify source nodes and assigns them to a key
    {
      userName: getUser.resp.body.name,
      favAnimal: getFavAnimal.resp.body.favAnimal,
    },
    // callback parameter should look like { key: sourceValue }
    mergeValues,
  );
});
```

Note that the merging link created by this method will only be used if ALL the source nodes specified are available i.e. if `getUser.resp.body.name` does not have a value, this link will not be used at all.

### Call Options

You can declare manual values for an endpoint call in the chainflow itself, should you need to do so, by passing in a Call Options object as a second argument in the `call` method.

`body`, `pathParams`, `query` and `headers` can be set this way.

```typescript
const createUser = origin.post('/user').body({
  name: 'Tom',
});

chainflow()
  .call(createUser, { body: { name: 'Harry' } })
  .run();
```

### `seed`

You can specify request nodes to take values from the chainflow 'seed' by importing the `seed` object and linking nodes to it. Provide actual seed values by calling the `seed` method on a chainflow before you `run` it, like below.

```typescript
import { chainflow, link seed, } from 'chainflow';

const createUser = origin.post('/user').body({
  name: required(),
});

createUser.set(({ body: { name }}) => {
  link(name, seed.username);
});

chainflow()
  .call()
  .seed({ username: 'Tom' })
  .run();
```

### Allow Undefined Sources Values

By default, an input node will reject and skip a source node's value if it is unavailable or `undefined`. However, you can change this by passing a source node into the `allowUndefined` function, which modifies its properties to inform an input node to use its value regardless of whether the value is `undefined` or not.

```typescript
import { allowUndefined } from 'chainflow';

createUser.set(({ body: { name } }) => {
  link(name, allowUndefined(seed.username));
});
```

This has important implications - it means that as long as the source (e.g. a response from an endpoint call) is available, then the linked source node's value will be taken and used (even if that value is unavailable, which would be taken as `undefined`). Therefore, any other linked sources will not be used UNLESS 1. they have a higher priority or 2. the source providing the linked node that allows `undefined` is unavailable.

&nbsp;

### `clone`

You can create chainflow "templates" with the use of `clone` to create a copy of a chainflow and its endpoint callqueue. The clone can have endpoint calls added to it without modifying the initial flow.

```typescript
const initialFlow = chainflow().call(endpoint1).call(endpoint2);

const clonedFlow = initialFlow.clone();

clonedFlow.call(endpoint3).run(); // calls endpoint 1, 2 and 3
initialFlow.call(endpoint4).run(); // calls endpoint 1, 2 and 4
```

### `extend`

You can connect multiple different chainflows together into a longer chainflow using `extend`.

```typescript
const flow1 = chainflow().call(endpoint1).call(endpoint2);
const flow2 = chainflow().call(endpoint3);

flow1.extend(flow2).run(); // calls endpoint 1, 2 and 3
```

### `config`

`respParser`  
By default, Chainflows will parse response bodies as JSON objects. To change this, you can call `.config` to change that configuration on an `endpoint` (or on an `OriginServer`, to apply it to all endpoints created from it) like so:

```typescript
import { RespParser } from 'chainflow';

const getUser = origin.get('/user').config({
  respParser: RespParser.Text,
});
```

or with camelcase in JavaScript:

```javascript
const getUser = origin.get('/user').config({
  respParser: 'text',
});
```

There are 4 supported ways to parse response bodies (as provided by the underlying HTTP client, `undici`): `arrayBuffer`, `blob`, `json` and `text`.

`respValidator`  
Another configuration option is how to validate the response to an endpoint. By default, Chainflow only accepts responses that have HTTP status codes in the 200-299 range, and rejects responses otherwise (meaning their values will not be stored). You can pass in a custom `respValidator` to change this behaviour.

```typescript
const testEndpoint = origin.get('/user').config({
  respValidator: (resp) => {
    if (resp.statusCode !== 201) return { valid: false, msg: 'Failed to retrieve users.' };
    return { valid: true };
  },
});
```

### `store`

Instead of direct links between endpoints, you can use a central store to keep values from some endpoints and have other endpoints take from it via the special `store` object.

```typescript
import { store } from 'chainflow';

const createUser = origin
  .post('/user')
  .body({
    name: 'Tom',
  })
  .store((resp) => ({
    // this endpoint will store `id` from a response to `userId` in the store
    userId: resp.body.id,
  }));

const addRole = origin.post('/role').body({
  // this endpoint will take `userId` from the store, if available
  userId: store.userId,
  role: 'Engineer',
});

chainflow().call(createUser).call(addRole).run();
```

This is usually useful when you have endpoints that could take a value from any one of many other endpoints for the same input node. Having a store to centralise these many-to-many relationships (like an API Gateway) can improve the developer experience.

### `continuesFrom` - transferring Chainflow states

Say we have 2 endpoints, `login` and `createGroup`. We want to login as a user once, then proceed to proceed 3 groups as that same user without having to login 3 times.

```typescript
const createGroup = origin
  .post('/group')
  .headers({
    Authorization: login.resp.body.authToken,
  })
  .body({
    groupName: seed.groupName,
  });

// loggedInFlow will contain a response from the `login` endpoint
const loggedInFlow = chainflow().call(login).run();

// createGroupFlow will take the response that
// loggedInFlow received and carry on from there
const createGroupFlow = chainflow().call(createGroup).continuesFrom(loggedInFlow);

const groupNames = ['RapGPT', 'Averageexpedition', 'Shaky Osmosis'];
for (const groupName in groupNames) {
  createGroupFlow.seed({ groupName }).run();
}
```

We run a chainflow that calls `login` first to get a response from the login endpoint.

Using the `continuesFrom` method, `createGroupFlow` will copy the state of source values (i.e. responses) from `loggedInFlow`. This means `createGroupFlow` will now have the logged in user's `authToken` received from calling `login`, and will use it when calling `createGroup` thrice for each group name in the `groupNames` array.

### `logging`

Enable logs from Chainflow by setting `ENABLE_CHAINFLOW_LOGS=true` in your environment variables.

## Future Updates

Below features are currently not yet supported but are planned in future releases.

1. More flexibility to log and return responses
2. API performance testing
3. (Exploratory) Possibly some sort of UI/diagram generation

## Development

Run specific test files:

`pnpm run test:file ./src/**/chainflow.test.ts`

### Trivia

- You probably noticed that I enjoy using the Builder pattern for its clarity.
- I'm praying the wave 🌊 emoji remains sufficiently shaped like a "C" to avoid confusion. Please let me know if there is some system where it does not!
