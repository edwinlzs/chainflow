import { terminal as term } from 'terminal-kit';
import { guideRow, numRows, sideMenuRow, state } from './state';

export class Terminal {
  /** @todo make this an actual normal log */
  log(text: string) {
    term.nextLine(1)(text).nextLine(1);
  }

  init() {
    term.clear();
  }

  handleKeyInputs(handler: (action: string, _matches: unknown, _data: unknown) => void) {
    term.hideCursor().grabInput({});
    term.on('key', (action: string, _matches: unknown, _data: unknown) => {
      if (action === 'CTRL_C') return term.processExit(0);
      handler(action, _matches, _data);
    });
  }

  renderMainMenu() {
    term.saveCursor();
    term.eraseLine().red(state.mainMenuTitle).nextLine(1);
    for (let i = 0; i < numRows; i++) {
      const option = state.menuOptions.main[i];
      term.eraseLine();
      if (option === undefined) {
        term.nextLine(1);
        continue;
      }
      term(' ');
      if (i === state.cursor.main)
        term.bgBrightWhite().black(option).defaultColor().bgDefaultColor().nextLine(1);
      else term(option).nextLine(1);
    }
    term.restoreCursor();
  }

  renderMainCursor(current: number, delta: number) {
    term.saveCursor();
    const currentOption = state.menuOptions.main[current];
    const nextOption = state.menuOptions.main[current + delta];
    term
      .nextLine(current + 1)
      .eraseLine()
      .bgDefaultColor()
      .defaultColor(' ')(currentOption);
    if (delta < 0) {
      term.previousLine(-delta);
    } else {
      term.nextLine(delta);
    }
    term.eraseLine()(' ').bgBrightWhite().black(nextOption);
    term.restoreCursor();
  }

  renderSideMenu() {
    term.saveCursor();
    term.nextLine(sideMenuRow).eraseLine();
    state.menuOptions.side.forEach((option, i) =>
      i === state.cursor.side
        ? term.bgBrightWhite().black(option).defaultColor().bgDefaultColor()(' ')
        : term(`${option} `),
    );
    term.delete(1).restoreCursor();
  }

  renderPage() {}

  renderGuide(guide: string) {
    term.saveCursor();
    term.nextLine(guideRow)(guide);
    term.restoreCursor();
  }
}

export const terminal = new Terminal();
