import { terminal as term } from 'terminal-kit';
import { guideRow, numRows, sideMenuRow, state } from './index legacy';
import { loadGuide } from './data';

/** Renders a menu displaying given options. */
export const renderMainMenu = ({
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
  for (let i = 0; i < numRows; i++) {
    const name = options[i];
    term.eraseLine();
    if (name === undefined) {
      term.nextLine(1);
      continue;
    }
    const text = formatter ? formatter(name) : name;
    term(' ');
    if (i === state.cursor.main)
      term.bgBrightWhite().black(text).defaultColor().bgDefaultColor().nextLine(1);
    else term(text).nextLine(1);
  }
  term.restoreCursor();
};

/** Renders a side menu displaying given options. */
export const renderSideMenu = (options: string[]) => {
  term.saveCursor();
  term.nextLine(sideMenuRow);
  options.forEach((option, i) =>
    i === state.cursor.side
      ? term.bgBrightWhite().black(option).defaultColor().bgDefaultColor()(' ')
      : term(`${option} `),
  );
  term.delete(1).restoreCursor();
};

/** Renders the guide */
export const renderGuide = () => {
  term
    .saveCursor()
    .nextLine(guideRow)
    .eraseLine()(
      loadGuide()
        .map((val) => `[${val}]`)
        .join(' '),
    )
    .restoreCursor();
};

/** Erases a rendered side menu. */
export const eraseSideMenu = () => {
  term.saveCursor().nextLine(sideMenuRow).eraseLine().restoreCursor();
};
