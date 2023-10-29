import { endpoint, route, valGen, valPool } from 'chainflow';
import { faker } from '@faker-js/faker';

const addr = '127.0.0.1:3001';

// Defining API signatures
const userPost = endpoint('POST', '/user').body({
  name: valGen(faker.person.fullName),
  favAnimal: valPool(['cat', 'dog', 'highland cow']),
});

const userGet = endpoint('GET', '/user').query({
  favAnimal: 'highland cow',
});
const user = route([userPost, userGet], addr);

const notificationPost = endpoint('POST', '/notification').query({
  msg: 'default notification',
});
const notification = route([notificationPost], addr);

export { user, notification };
