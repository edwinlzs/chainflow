import { terminal as term } from 'terminal-kit';
import { cursorIndex, devLogRow } from '..';

export const devLog =
  (...args: (string | number | boolean)[]) => {
    term
      .saveCursor()
      .nextLine(devLogRow)
      .eraseLine()(args.join(' '))
      .restoreCursor();
  };
