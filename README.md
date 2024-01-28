<h1 align="center" style="border-bottom: none;">🌊hainflow</h1>
<h3 align="center">Create dynamic and flexible API call workflows.</h3>

## Use Cases

1. Insert demo data via your app's APIs
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
  userId: createUser.resp.body.id,
});

const getUser = factory.get('/user').query({
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
const createUser = factory.post('/user').body({
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

const createUser = factory.post('/user').body({
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
      userName: getUser.resp.body.name,
      favAnimal: getFavAnimal.resp.body.favAnimal,
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

### Run Options

You can specify request nodes to take values from the chainflow 'seed' by importing the `seed` object and linking nodes to it. Provide seed values by passing them as arguments to a `run` call on a `chainflow`, like below.

```typescript
import { chainflow, link seed, } from 'chainflow';

const createUser = factory.post('/user').body({
  name: required(),
});

createUser.set(({ body: { name }}) => {
  link(name, seed.username);
});

chainflow()
  .call()
  .run({
    seed: {
      username: 'Tom',
    }
  });
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

You can create chainflow "templates" with the use of `clone` to create a copy of a chainflow and its endpoint callstack. The clone can have endpoint calls added to it without modifying the initial flow.

```typescript
const originalFlow = chainflow().call(endpoint1).call(endpoint2);

const clonedFlow = originalFlow.clone();

clonedFlow.call(endpoint3).run(); // calls endpoint 1, 2 and 3
originalFlow.call(endpoint4).run(); // calls endpoint 1, 2 and 4
```

### `extend`

You can connect multiple different chainflows together into a longer chainflow using `extend`.

```typescript
const flow1 = chainflow().call(endpoint1).call(endpoint2);
const flow2 = chainflow().call(endpoint3);

flow1.extend(flow2).run(); // calls endpoint 1, 2 and 3
```

### `config`

By default, Chainflows will parse response bodies as JSON objects. To change this, you can call `.config` to change that configuration on an `endpoint` (or on an `EndpointFactory`, to apply it to all endpoints created from it) like so:

```typescript
import { RespParser } from './chainflow';

const getUser = factory.get('/user').config({
  respParser: RespParser.Text,
});
```

or with camelcase in JavaScript:

```javascript
const getUser = factory.get('/user').config({
  respParser: 'text',
});
```

There are 4 supported ways to parse response bodies (as provided by the underlying HTTP client, `undici`): `arrayBuffer`, `blob`, `json` and `text`.

## Future Updates

Below features are currently not yet supported but are planned in future releases.

1. Content types other than `application/json`
2. HTTPS
3. Cookies

## Development

Run specific test files:

`pnpm run test:file ./src/**/chainflow.test.ts`
