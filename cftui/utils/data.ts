import { MENU, MENU_TITLE, state } from '..';
import { Chainflow } from 'chainflow';

export const loadMenu = (flows: Record<string, Chainflow>) => {
  if (state.mainMenuTitle === MENU_TITLE.CHAINFLOW) {
    return Object.keys(flows);
  }
  return [];
};

export const loadSideMenu = () => {
  if (state.mainMenuTitle === MENU_TITLE.CHAINFLOW) {
    return ['RUN', 'OPTS', 'BACK'];
  }
  return [];
};

export const loadGuide = () => {
  if (state.currentMenu === MENU.MAIN) {
    return ['▲ ▼ Move Cursor', '◀ ▶ Switch Pages', '↵ Select'];
  } else if (state.currentMenu === MENU.SIDE) {
    return ['◀ ▶ Move Cursor', '↵ Select']
  }
  return [];
}

export const getDisplayRows = (rows: string[], page: number, numRows: number) => {
  const topRow = page * numRows;
  return rows.length > numRows ? rows.slice(topRow, topRow + numRows) : rows;
};
