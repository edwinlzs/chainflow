<h1 align="center" style="border-bottom: none;">🌊hainflow</h1>
<h3 align="center">An Open Source library to create dynamic and composable API call workflows in TypeScript.</h3>
<div align="center">
  
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/edwinlzs/chainflow/blob/main/LICENSE)
&nbsp;
[![NPM version](https://img.shields.io/npm/v/chainflow.svg?style=flat-square)](https://www.npmjs.com/package/chainflow)
&nbsp;
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/edwinlzs/chainflow/ci.yml?style=flat-square&branch=main)](https://github.com/edwinlzs/chainflow/actions)
&nbsp;
[![codecov](https://img.shields.io/codecov/c/gh/edwinlzs/chainflow?token=O55JNRTCM5&style=flat-square&color=23a133)](https://codecov.io/gh/edwinlzs/chainflow)
</div>

## 📖 Documentation

### Read the guides over at [Chainflow Docs](https://edwinlzs.github.io/chainflow-docs/) to get started!

## 💭 When might Chainflow be useful?

1. **_Setting up demo data_**

   Say you have an application that you're developing new features for and you'd like to demonstrate those features. You may need your app to be in a certain context and hence your database in a specific state - perhaps a user has to be logged in with certain permissions, and to have already created a "group" in the app and added other users to that group. You might manually click into your app and log in as a user to set everything up, but that could be tedious. Alternatively, you may thus use raw SQL or other DB scripts to insert users, roles, etc. However, those scripts could miss out on important side effects relevant to the business context of your app that tend to be built into the services exposed by your backend server.

   Chainflow helps you compose API call workflows to setup the data in your app by calling the relevant service endpoints you have built e.g. `POST /user`, `POST /role`. You can then avoid manual setups and minimize your use of database scripts to just data that is not configurable with existing endpoints!

2. **_Speeding up development_**

   Similar to setting up demo data, often while coding new features you may want to test out how they behave in your app, and again you may want your app to be in a specific state locally for that. You can write API call workflow scripts built with Chainflow to help move your app into those states quickly.

3. **_Testing your endpoints_**

   An API call workflow could behave as if it were a frontend client calling the backend. In that way, you can create UI-agnostic end-to-end testing of backend endpoints by using API call workflows to simulate how a frontend would interact with the backend.

## ⚠️ (Important!) Note

Chainflow is my first and somewhat experimental open-source project which I started to assist my own development work. It's similar to [Postman Flows](https://learning.postman.com/docs/postman-flows/gs/flows-overview/), but done in code so us engineers have even greater control over the process (+ the ease of writing simple scripts with Chainflow to be run in your CLI or as pipeline jobs etc.).

I am still finding and ironing out pain points in using the library and releases should be considered unstable while I improve the library's usability. It is far from perfect in its current state, but I will continue to improve upon it if I or others find potential in its use. Therefore, your feedback and ideas are very important to me. I welcome thoughts on just about anything - useful dev tools to manage this project, QoL features to support easier coding patterns when using this library or even thoughts on the future direction of this project.

Drop them as a [Github issue](https://github.com/edwinlzs/chainflow/issues) or email me at <edwinlzscode@gmail.com>!

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

### Query params

Define query params with the `query` method on an endpoint.

```typescript
const getUsersInGroup = origin.get('/user').query({ groupId: 'some-id' });
```

### Path params

Define path params by wrapping a param name with `{}` in the endpoint path.

```typescript
const getGroupsWithUser = origin.get('/groups/{userId}');
```

You can specify values for your path params by calling `pathParams`. Note that path params which do not actually exist in the path will be discarded.

```typescript
const getGroupsWithUser = origin.get('/groups/{userId}').pathParams({
  userId: 'user123',
});
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

### Default headers

Chainflow attaches default headers to all requests made by any endpoint with the value:

```typescript
'content-type': 'application/json',
'User-Agent': 'Chainflow/[major.minor version number]',
```

If you'd like to change this, pass your default headers to the `defaultHeaders` util.

```typescript
import { defaultHeaders } from 'chainflow';

defaultHeaders({ 'content-type': 'application/xml' });
```

Pass in `true` as the second argument if you want to replace the entire set of default headers. Otherwise, the example above only overwrites the `content-type` default header and keeps `User-Agent`.

### Initializing Values

The request payloads under `Basic Usage` are defined with only _default_ values - i.e. the values which a Chainflow use if there are no response values from other endpoint calls linked to it.

However, you can also use the following features to more flexibly define the values used in a request.

### `required`

Marks a value as required but without a default. The chainflow will expect this value to be sourced from another node. If no such source is available, the endpoint call will throw an error.

```typescript
const createUser = origin.post('/user').body({
  name: required(),
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

### `link`

You can use the `link` function to specify a callback to transform the response value before it is passed to the input node.

```typescript
const addGreeting = (name: string) => `Hello ${name}`;

const createMessage = origin.post('message').body({
  msg: link(getUser.resp.body.name, addGreeting);
});
```

### `set`

The `link` has another function signature.

You can use the `set` method on an endpoint to expose its input nodes, then use the 2nd function signature of `link` as shown below: pass in the input node first (`msg`), then the source node second and optionally a callback third.

```typescript
createMessage.set(({ body: { msg } }) => {
  link(msg, getUser.resp.body.name);
  link(msg, createUser.resp.body.name);
});
```

With a callback:

```typescript
createMessage.set(({ body: { msg } }) => {
  link(msg, getUser.resp.body.name, addGreeting);
  link(msg, createUser.resp.body.name, addGreeting);
});
```

### `linkMerge`

Link multiple response values to a single request node with an optional callback to merge the values into a single input value. This has 4 function signatures:

For the argument containing the source nodes, you can either pass an _array_ of SourceNodes:

```typescript
// note the callback has an array parameter
const mergeValues = ([name, favAnimal]: [string, string]) =>
  `${name} likes ${favAnimal}.`;

const createMessage = origin.post('message').body({
  msg: linkMerge(
    // array of source nodes
    [getUser.resp.body.name, getFavAnimal.resp.body.favAnimal],
    mergeValues,
  );
});
```

or you can pass an _object_ with SourceNodes as the values:

```typescript
// note the callback has an object parameter
const mergeValues = ({
  userName,
  favAnimal,
}: {
  userName: string;
  favAnimal: string;
}) => `${userName} likes ${favAnimal}.`;


const createMessage = origin.post('message').body({
  msg: linkMerge(
    // object of source nodes
    {
      userName: getUser.resp.body.name,
      favAnimal: getFavAnimal.resp.body.favAnimal,
    },
    mergeValues,
  );
});
```

alternatively, you can use the `set` method in addition with the other function signature of `linkMerge` (similar to how `link` above has overloads to work with `set`).

with array:

```typescript
createMessage.set(({ body: { msg } }) => {
  linkMerge(
    msg, // the input node
    [getUser.resp.body.name, getFavAnimal.resp.body.favAnimal],
    mergeValues,
  );
});
```

with object:

```typescript
createMessage.set(({ body: { msg } }) => {
  linkMerge(
    msg, // the input node
    {
      userName: getUser.resp.body.name,
      favAnimal: getFavAnimal.resp.body.favAnimal,
    },
    mergeValues,
  );
});
```

Note that the merging link created by this method will only be used if ALL the source nodes specified are available i.e. if either one of `getUser.resp.body.name` or `getFavAnimal.resp.body.favAnimal` does not have a value, this link will not be used at all.

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

By default, an input node will reject and skip a source node's value if it is unavailable or `undefined`. However, you can change this by passing a source node into the `config` utility function and passing an options object as the second parameter like below. This informs an input node to use the source node's value regardless of whether the value is `undefined` or not.

```typescript
import { config } from 'chainflow';

createUser.set(({ body: { name } }) => {
  link(name, config(seed.username, { allowUndefined: true }));
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
By default, a chainflow parses response bodies as JSON objects UNLESS the status code is `204` or the `content-type` header does not contain `application/json` (to avoid errors when parsing an empty body), upon which they will instead parse it as text.

To set a specific parsing format, you can call `.config` to change that configuration on an `endpoint` (or on an `OriginServer`, to apply it to all endpoints created from it) like so:

```typescript
import { RESP_PARSER } from 'chainflow';

const getUser = origin.get('/user').config({
  respParser: RESP_PARSER.TEXT,
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
Another configuration option is how to validate the response to an endpoint. By default, Chainflow rejects responses that have HTTP status code 400 and above and throws an error. You can pass in a custom `respValidator` to change when a response is rejected.

```typescript
const getUser = origin.get('/user').config({
  respValidator: (resp) => {
    if (resp.statusCode !== 201) return { valid: false, msg: 'Failed to retrieve users.' };
    if (!Object.keys(resp.body as Record<string, unknown>).includes('id'))
      return { valid: false, msg: 'Response did not provide user ID.' };
    return { valid: true };
  },
});
```

Your custom validator callback should have a return type:

```typescript
{
  valid: boolean; // false if response should be rejected
  msg?: string; // error message
}
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

### `events`

After running a chainflow, you can retrieve the request and response event data from endpoint calls executed during that run via the `events` property on that chainflow.

```typescript
const flow = chainflow().run(createUser).run(getRoles);

const events = flow.events;
```

The events will look something like:

```typescript
[
  {
    details: '[POST] /user', // identifies the endpoint called
    req: {
      method: 'POST',
      url: ...,
      body: ...,
      headers: ...,
      respParser: ..., // the format used to parse the response body
    },
    resp: {
      statusCode: 200,
      body: ...,
      headers: ...,
      ...
    }
  },
  {
    details: '[GET] /roles',
    req: ...,
    resp: ...
  }
]
```

The responses in the array follow the order in which the respective endpoints are called.

### `logging`

Enable logs from Chainflow by setting `ENABLE_CHAINFLOW_LOGS=true` in your environment variables, or by simply importing and calling the `enableLogs` function.

### Misc Behaviors

- If you have multiple endpoint calls to the same endpoint on one chainflow and they are linked to other endpoints' input nodes further down the flow, the latest endpoint call's values will be used.

For example:

```typescript
chainflow().call(getUser).call(addRole).call(getUser).call(createGroup);
```

If an input node on `createGroup` requires a value from a response to `getUser`, then `createGroup` will take that value from the last call to `getUser` (i.e. from the response to the 2nd call to `getUser` that happens _after_ the call to `addRole`).

## Future Updates

Below features are currently not yet supported but are planned in future releases.

1. More flexibility to log and return responses
2. Conditional calls - execute an endpoint call only if some condition is met.
3. (Exploratory) API performance measurement
4. (Exploratory) Possibly some sort of UI/diagram generation

## Development

### Areas that could be better (non-exhaustive)

#### _Encoding endpoint IDs_

- Currently assumes that URLs of endpoints do not contain unencoded `|` and `[]` characters. `[]` used to wrap around HTTP method in the encoded ID. Linkmerge uses `|` to separate different encoded IDs.
- Current implementation also leads to ID collision if multiple endpoints with the same method and path are created (but perhaps with different configuration) and are called on the same chainflow.
- Idea: Have a centralized service to issue unique IDs to deconflict endpoints - but still somehow encode the method/path info of an endpoint into it.

#### _Logging_

- Should further explore appropriate degree of detail for logging
- Truncation of requests/responses with extremely large payloads

### Trivia

- You probably noticed that I enjoy using the Builder pattern for its clarity.
- I'm praying the wave 🌊 emoji remains sufficiently shaped like a "C" to avoid confusion. Please let me know if there is some system where it does not!
