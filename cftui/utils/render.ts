import { terminal as term } from 'terminal-kit';
import { cursorIndex, sideMenuRow } from '..';

/** Renders a menu displaying given options. */
export const renderMenu = ({
  options,
  title,
  formatter,
}: {
  options: string[];
  title: string;
  formatter?: (val: string) => string;
}) => {
  term.saveCursor();
  term.eraseLine().red(title).nextLine(1);
  options.forEach((name, i) => {
    term.eraseLine()(' ');
    const text = formatter ? formatter(name) : name;
    if (i === cursorIndex) return term.bgBrightWhite(text).defaultColor().nextLine(1);
    term(text).nextLine(1);
  });
  term.restoreCursor();
};

/** Renders a side menu displaying given options. */
export const renderSideMenu = ({ options }: { options: string[] }) => {
  term.saveCursor();
  term.nextLine(sideMenuRow)(options.join(' '));
  term.restoreCursor();
};

/** Handles moving the custom cursor through a menu */
export const handleDirections = (name: string, numRows: number, cursorIndex: number) => {
  let scrollUp = false,
    scrollDown = false;

  if (name === 'UP') {
    if (cursorIndex > 0) {
      cursorIndex -= 1;
    } else {
      scrollUp = true;
    }
  } else if (name === 'DOWN') {
    if (cursorIndex < numRows - 1) {
      cursorIndex += 1;
    } else {
      scrollDown = true;
    }
  }

  return { cursorIndex, scrollUp, scrollDown };
};
