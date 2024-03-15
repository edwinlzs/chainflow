import { terminal as term } from 'terminal-kit';

/** Renders a menu from an array of strings */
export const renderMenu = ({
  options,
  title,
  cursorIndex,
  formatter,
}: {
  options: string[];
  title: string;
  cursorIndex: number;
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

/** Handles moving the custom cursor through a menu */
export const handleDirections = (name: string, yMin: number, yMax: number, cursorIndex: number) => {
  let scrollUp = false, scrollDown = false;

  if (name === 'UP') {
    if (cursorIndex > yMin) {
      cursorIndex -= 1;
    } else { scrollUp = true };
  } else if (name === 'DOWN') {
    if (cursorIndex < yMax - 2) {
      cursorIndex += 1;
    } else {
      scrollDown = true;
    }
  }

  return { cursorIndex, scrollUp, scrollDown };
};