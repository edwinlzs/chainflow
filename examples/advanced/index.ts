import { chainflow, InputNodes, link } from 'chainflow';
import { createNotification, createUser, getUser } from './src/definitions';

// create the chains
createNotification.set(({ body: { msg } }: InputNodes) => {
  link(msg, createUser.resp.users); // TODO: multiple API calls on user count
});

console.log("Running chainflows");

// run the chainflows
const chain = chainflow();
chain.call(createUser).call(getUser).call(createNotification).run();
