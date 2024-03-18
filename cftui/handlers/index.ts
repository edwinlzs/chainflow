import { MENU, MENU_TITLE, State } from '../utils/index legacy';
import { cfMainSelect } from './cfMainSelect';
import { cfSideSelect } from './cfSideSelect';

/** Handles a select (enter) input action. */
export const handleSelect = (state: State) => {
  if (state.mainMenuTitle === MENU_TITLE.CHAINFLOW) {
    if (state.currentMenu === MENU.MAIN) {
      return cfMainSelect(state);
    } else if (state.currentMenu === MENU.SIDE) {
      return cfSideSelect(state);
    }
  }
  return state;
};
