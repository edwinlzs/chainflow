import { Chainflow } from 'chainflow';
import { cfid } from 'chainflow/core/utils/symbols';

const CHAINFLOWS_FILE = '../fixtures/index.ts';

export const loadCf = async (): Promise<Record<string, Chainflow>> => {
  const cfModule = await import(CHAINFLOWS_FILE);

  console.log(Object.getOwnPropertyDescriptors( cfModule));

  return Object.entries(cfModule).reduce(
    (acc: Record<string, Chainflow>, [cfName, val]: [string, any]) => {
      if (!(val && val[cfid])) return acc;
      acc[cfName] = val as Chainflow;
      return acc;
    },
    {},
  );
};
