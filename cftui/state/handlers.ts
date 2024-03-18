import { State, state } from './state';

export type ACTION = 'ENTER' | 'BACK' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const KeyActionMap: Record<string, ACTION> = {
  ENTER: 'ENTER',
  KP_ENTER: 'ENTER',
  ESCAPE: 'BACK',
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

export interface Handler {
  actions: Record<string, () => void>;
  loadMainMenu?: (state: State) => void;
  loadSideMenu?: (state: State) => void;
  guide: string[];
}

export const cfMain: Handler = {
  actions: {
    UP: () => state.moveMainCursor(-1),
    DOWN: () => state.moveMainCursor(1),
    LEFT: () => state.changePage(-1),
    RIGHT: () => state.changePage(1),
    ENTER: () => {
      state.selectMain('chainflow');
      state.setHandler(cfSide);
      state.openSideMenu();
    },
  },
  loadMainMenu: (state: State) => {
    state.menuOptions.main = Object.keys(state.flows);
  },
  guide: ['▲ ▼ Move Cursor', '◀ ▶ Switch Pages', '↵ Select', 'Ctrl+C Exit'],
};

export const cfSide: Handler = {
  actions: {
    LEFT: () => state.moveSideCursor(-1),
    RIGHT: () => state.moveSideCursor(1),
    ENTER: () => {

    },
    BACK: () => {
      state.setHandler(cfMain);
      state.closeSideMenu();
    },
  },
  loadSideMenu: (state: State) => {
    state.menuOptions.side = ['RUN', 'BACK'];
  },
  guide: ['◀ ▶ Move Cursor', '↵ Select'],
};
