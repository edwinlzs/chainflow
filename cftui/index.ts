import { loadCf } from './utils/loadCf';
import { terminal as term } from 'terminal-kit';
import { renderGuide, renderMainMenu, renderSideMenu } from './utils/render';
import { getDisplayRows, loadMenu, loadSideMenu } from './utils/data';
import { handleDirections } from './utils/input';
import { handleSelect } from './handlers';
import { Chainflow } from 'chainflow';

export const CHAINFLOWS_FILE = '../fixtures/index.ts';

export enum MENU_TITLE {
  CHAINFLOW = 'CHAINFLOWS',
  ENDPOINT = 'ENDPOINTS',
}

export enum MENU {
  MAIN,
  SIDE,
}

export const numRows = 5;
export const sideMenuRow = 7;
export const guideRow = 8;
export const devLogRow = 9;

export interface State {
  page: number;
  maxPage: number;
  cursor: {
    main: number;
    side: number;
  },
  mainMenuTitle: MENU_TITLE;
  currentMenu: MENU;
  menuOptions: {
    main: string[];
    side: string[];
    // sideSelected: string | null;
  };
  selections: {
    chainflow: string | null;
  };
}

export let state: State = {
  page: 0,
  maxPage: 0,

  cursor: {
    main: 0,
    side: 0,
  },

  mainMenuTitle: MENU_TITLE.CHAINFLOW,
  currentMenu: MENU.MAIN,

  menuOptions: {
    main: [],
    side: [],
    // sideSelected: null,
  },
  selections: { chainflow: null },
};

export let flows: Record<string, Chainflow>;

const run = async () => {
  term.clear();

  flows = await loadCf();
  state.maxPage = Math.ceil(Object.keys(flows).length / numRows);
  term.nextLine(1)(`Loaded chainflows from ${CHAINFLOWS_FILE}:`).nextLine(1);

  let options = loadMenu(flows);
  state.menuOptions.main = getDisplayRows(options, state.page, numRows);
  state.menuOptions.side = loadSideMenu();

  renderMainMenu({
    options: state.menuOptions.main,
    title: state.mainMenuTitle,
  });
  renderGuide();
  term.hideCursor().grabInput({});
  term.on('key', (action: string, _matches: unknown, _data: unknown) => {
    if (action === 'CTRL_C') term.processExit(0);

    state = handleDirections(action, state);
    state.menuOptions.main = getDisplayRows(options, state.page, numRows);

    if (['ENTER', 'KP_ENTER'].includes(action)) {
      state = handleSelect(state);
    }

    renderMainMenu({
      options: state.menuOptions.main,
      title: state.mainMenuTitle,
    });
    renderGuide();

    if (state.currentMenu === MENU.SIDE) renderSideMenu(state.menuOptions.side);
  });
};
run();
