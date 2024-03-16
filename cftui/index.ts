import { loadCf } from './utils/loadCf';
import { terminal as term } from 'terminal-kit';
import { handleDirections, renderMenu, renderSideMenu } from './utils/render';
import { Chainflow } from 'chainflow';
import { devLog } from './utils/log';

export const CHAINFLOWS_FILE = '../fixtures/index.ts';

enum MENU {
  CHAINFLOW = 'CHAINFLOWS',
  ENDPOINT = 'ENDPOINTS',
}

export enum SUBMENU {
  MAIN,
  SIDE,
}

let topRow = 0;
const numRows = 5;
export const sideMenuRow = 7;
export const devLogRow = 8;
export let cursorIndex = 0;
let currentMenu = MENU.CHAINFLOW;
let submenu = SUBMENU.MAIN;

const run = async () => {
  term.clear();

  let flows = await loadCf();
  term(`Loaded chainflows from ${CHAINFLOWS_FILE}:`).nextLine(1);

  let selected: string | null = null;
  let { options } = loadMenu(flows);
  let optionsDisplayed = getDisplayRows(options, topRow, numRows);

  renderMenu({
    options: optionsDisplayed,
    title: currentMenu,
  });
  term.hideCursor().grabInput({});
  term.on('key', (name: string, _matches: unknown, _data: unknown) => {
    if (name === 'CTRL_C') term.processExit(0);

    const result = handleDirections(name, numRows, cursorIndex);
    cursorIndex = result.cursorIndex;
    if (result.scrollUp && topRow > 0) {
      topRow -= 1;
      optionsDisplayed = getDisplayRows(options, topRow, numRows);
    } else if (result.scrollDown && options.length > topRow + numRows) {
      topRow += 1;
      optionsDisplayed = getDisplayRows(options, topRow, numRows);
    }

    if (['ENTER', 'KP_ENTER'].includes(name)) {
      selected = optionsDisplayed[cursorIndex];

      submenu = SUBMENU.SIDE;
      renderSideMenu(loadSideMenu());
      devLog(selected);
    }

    renderMenu({
      options: optionsDisplayed,
      title: currentMenu,
    });
  });
};

const loadMenu = (flows: Record<string, Chainflow>) => {
  if (currentMenu === MENU.CHAINFLOW) {
    return { options: Object.keys(flows) };
  }
  return { options: [] };
};

const loadSideMenu = () => {
  if (currentMenu === MENU.CHAINFLOW) {
    return { options: ['RUN', 'OPTS', 'BACK'] };
  }
  return { options: [] };
};

const getDisplayRows = (rows: string[], topRow: number, numRows: number) =>
  rows.length > numRows ? rows.slice(topRow, topRow + numRows) : rows;

run();
