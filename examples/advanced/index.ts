import { chainflow, InputNodes, link, linkMany } from 'chainflow';
import { createNotification, createUser, getFavAnimalOfUser } from './src/definitions';

// create the chains
getFavAnimalOfUser.set(({ pathParams: { userId } }) => {
  link(userId, createUser.resp.id);
})

createNotification.set(({ body: { msg } }: InputNodes) => {
  linkMany(
    msg,
    {
      userName: createUser.resp.name,
      favAnimal: getFavAnimalOfUser.resp.favAnimal,
    },
    ({ userName, favAnimal }) => `${userName} likes ${favAnimal}`,
  );
});

console.log("Running chainflows");

// run the chainflows
const chain = chainflow();
chain.call(createUser).call(getFavAnimalOfUser).call(createNotification).run();
