import { chainflow, InputNodes, link } from 'chainflow';
import { notification, user } from './src/definitions';

// create the chains
notification.post.set(({ body: { msg } }: InputNodes) => {
  link(msg, user.post.resp.users); // TODO: multiple API calls on user count
});

console.log("Running chainflows");

// run the chainflows
const chain = chainflow();
chain.post(user).get(user).run();