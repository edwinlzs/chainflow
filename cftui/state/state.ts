import { Chainflow } from 'chainflow';
import { terminal } from './terminal';
import { Handler, KeyActionMap, cfMain } from './handlers';
import { loadCf } from './loadCf';

export const CHAINFLOWS_FILE = '../fixtures/index.ts';

export enum MENU_TITLE {
  CHAINFLOW = 'CHAINFLOWS',
  ENDPOINT = 'ENDPOINTS',
}

export enum MENU {
  MAIN,
  SIDE,
}

export let flows: Record<string, Chainflow>;

export const numRows = 5;
export const sideMenuRow = 7;
export const guideRow = 8;
export const devLogRow = 9;

export class State {
  page: {
    current: number;
    max: number;
  } = {
    current: 0,
    max: 0,
  };

  cursor: {
    main: number;
    side: number;
  } = { main: 0, side: 0 };
  mainMenuTitle: MENU_TITLE = MENU_TITLE.CHAINFLOW;
  currentMenu: MENU = MENU.MAIN;
  menuOptions: {
    main: string[];
    side: string[];
  } = {
    main: [],
    side: [],
  };
  selections: {
    [key: string]: string|undefined;
    chainflow?: string;
  } = {};

  flows: Record<string, Chainflow> = {};
  handler: Handler = cfMain;

  async init() {
    terminal.init();
    this.flows = await loadCf();
    this.page.max = Math.ceil(Object.keys(this.flows).length / numRows);
    terminal.log(`Loaded chainflows from ${CHAINFLOWS_FILE}:`);
    this.handler.loadMainMenu?.(this);
    terminal.handleKeyInputs((action: string) => this.handler.actions[KeyActionMap[action]]?.());
    terminal.renderMainMenu();
    terminal.renderGuide(this.handler.guide.map((val) => `[${val}]`).join(' '));
  }

  setHandler(handler: Handler) {
    this.handler = handler;
  }

  openSideMenu() {
    this.handler.loadSideMenu?.(this);
    this.cursor.side = 0;
    terminal.renderSideMenu();
  }

  closeSideMenu() {
    this.menuOptions.side = [];
    this.cursor.side = 0;
    terminal.renderSideMenu();
  }

  moveMainCursor(delta: number) {
    const next = this.cursor.main + delta;
    if (next >= 0 && next < numRows) {
      terminal.renderMainCursor(this.cursor.main, delta);
      this.cursor.main = next;
    }
  }

  moveSideCursor(delta: number) {
    const next = this.cursor.side + delta;
    if (next >= 0 && next < this.menuOptions.side.length) {
      this.cursor.side = next;
      terminal.renderSideMenu();
    }
  }

  changePage(delta: number) {
    const next = this.page.current + delta;
    if (next >= 0 && next < this.page.max - 1) {
      this.page.current = next;
      terminal.renderPage();
    }
  }

  selectMain(key: string) {
    this.selections[key] = this.menuOptions.main[this.cursor.main];
  }
}

export const state = new State();
