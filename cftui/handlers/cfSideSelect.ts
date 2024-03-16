import { MENU, State, flows } from '..';
import { eraseSideMenu, } from '../utils/render';

/** @todo Handles a selection in the Chainflow side menu. */
export const cfSideSelect = (state: State) => {
  const sideSelect = state.menuOptions.side[state.cursor.side];

  if (sideSelect === 'RUN') {
    // execute the selected chainflow
    const selectedCf = state.selections.chainflow;
    if (selectedCf) flows[selectedCf].run();
  } else if (sideSelect === 'OPTS') {
    /** @todo */
  } else if (sideSelect === 'BACK') {
    state.selections.chainflow = null;
    state.currentMenu = MENU.MAIN;
    eraseSideMenu();
  }

  // state.currentMenu = MENU.SIDE;
  // renderSideMenu(state.sideMenuOptions);
  return state;
};
