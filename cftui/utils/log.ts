import { terminal as term } from 'terminal-kit';
import { devLogRow } from '..';

export const devLog = (...args: unknown[]) => {
  term
    .saveCursor()
    .nextLine(devLogRow)
    .eraseLine()(args.map((arg) => `${arg}`).join(' '))
    .restoreCursor();
};
