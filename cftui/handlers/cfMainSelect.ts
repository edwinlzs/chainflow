import { MENU, State } from '..';
import { renderSideMenu } from '../utils/render';

/** Handles a selection in the Chainflow main menu. */
export const cfMainSelect = (state: State) => {
  state.selections.chainflow = state.menuOptions.main[state.cursor.main];
  state.currentMenu = MENU.SIDE;
  renderSideMenu(state.menuOptions.side);
  return state;
};
