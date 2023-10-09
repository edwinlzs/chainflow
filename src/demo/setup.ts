/** TEST ZONE */

import { Endpoint } from '../core/endpoint';
import { Route } from '../core/route';

// this section should be derived by the lib from API specs

const userPostPayload = {
  name: 'user - name',
  details: {
    sex: 'user - sex',
  },
};

const userPost = new Endpoint({ route: '/user', method: 'POST' });
userPost.req = userPostPayload;
userPost.res = userPostPayload;
const user = new Route({ post: userPost });

// console.log(JSON.stringify(userPost.res, null, 2));

const rolePostPayload = {
  name: 'role - name',
  type: 'role - type',
};

const rolePost = new Endpoint({ route: '/role', method: 'POST' });
rolePost.req = rolePostPayload;
rolePost.res = rolePostPayload;
const role = new Route({ post: rolePost });

export { user, role };
