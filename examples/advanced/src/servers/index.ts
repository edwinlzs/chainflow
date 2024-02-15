import { paymentsApp } from './paymentsServer';
import { petStoreApp } from './petStoreServer';
import { Order, Payment, Pet, User } from './types';

/** Super simple emulation of a DB. */
export const db = {
  users: {} as Record<string, User>,
  pets: {} as Record<string, Pet>,
  orders: {} as Record<string, Order>,
  payments: {} as Record<string, Payment>,
};

const PET_STORE_PORT = 3030;
const PAYMENTS_PROCESSOR_PORT = 5050;

petStoreApp.listen(PET_STORE_PORT, () => {
  console.log(`Pet store server listening on port ${PET_STORE_PORT}`);
});

paymentsApp.listen(PAYMENTS_PROCESSOR_PORT, () => {
  console.log(`Payments server listening on port ${PAYMENTS_PROCESSOR_PORT}`);
});
