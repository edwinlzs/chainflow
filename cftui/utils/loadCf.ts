import { Chainflow } from 'chainflow';
import { cfid } from 'chainflow/core/utils/symbols';
import { CHAINFLOWS_FILE } from '..';

export const loadCf = async (): Promise<Record<string, Chainflow>> => {
  const cfModule = await import(CHAINFLOWS_FILE);

  return Object.entries(cfModule).reduce(
    (acc: Record<string, Chainflow>, [cfName, val]: [string, any]) => {
      if (!(val && val[cfid])) return acc;
      acc[cfName] = val as Chainflow;
      return acc;
    },
    {},
  );
};
