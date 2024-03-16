import { MENU, State, numRows } from '..';

export const handleDirections = (action: string, state: State): State => {
  if (state.currentMenu === MENU.MAIN) return handleMainMenuDirections(action, state);
  else if (state.currentMenu === MENU.SIDE) return handleSideMenuDirections(action, state);
  return state;
};

/** Handles moving the custom cursor through the side menu */
const handleSideMenuDirections = (action: string, { cursor, ...state }: State) => {
  if (action === 'LEFT' && cursor.side > 0) cursor.side -= 1;
  else if (action === 'RIGHT' && cursor.side < state.menuOptions.side.length - 1) cursor.side += 1;
  return { ...state, cursor };
};

/** Handles moving the custom cursor through the main menu */
const handleMainMenuDirections = (action: string, { page, cursor, ...state }: State) => {
  if (action === 'UP' && cursor.main > 0) {
    cursor.main -= 1;
  } else if (action === 'DOWN' && cursor.main < numRows - 1) {
    cursor.main += 1;
  } else if (action === 'LEFT' && page > 0) {
    page -= 1;
    cursor.main = 0;
  } else if (action === 'RIGHT' && page < state.maxPage - 1) {
    page += 1;
    cursor.main = 0;
  }

  return { ...state, page, cursor };
};
