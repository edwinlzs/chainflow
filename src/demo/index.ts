/** USER TEST ZONE */
import { chainflow } from '../core/chainflow.js';
import { ReqNodes } from '../core/endpoint.js';
import { role, user } from './setup.js';

// create the chains
role.post?.set((link, { name }: ReqNodes) => {
  name && link(name, user.post?.res.name);
});

// run the chainflows
const chain = chainflow();
chain.post(user).post(role).run();
