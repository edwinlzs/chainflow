import { Chainflow } from "chainflow";
import { state } from "./state/state";

let flows: Record<string, Chainflow>;

const run = async () => {
  state.init();

  // let options = loadMenu(flows);
  // state.menuOptions.main = getDisplayRows(options, state.page, numRows);
  // state.menuOptions.side = loadSideMenu();

  // renderMainMenu({
  //   options: state.menuOptions.main,
  //   title: state.mainMenuTitle,
  // });
  // renderGuide();
  // term.hideCursor().grabInput({});
  // term.on('key', (action: string, _matches: unknown, _data: unknown) => {
  //   if (action === 'CTRL_C') term.processExit(0);

  //   state = handleDirections(action, state);
  //   state.menuOptions.main = getDisplayRows(options, state.page, numRows);

  //   if (['ENTER', 'KP_ENTER'].includes(action)) {
  //     state = handleSelect(state);
  //   }

  //   renderMainMenu({
  //     options: state.menuOptions.main,
  //     title: state.mainMenuTitle,
  //   });
  //   renderGuide();

  //   if (state.currentMenu === MENU.SIDE) renderSideMenu(state.menuOptions.side);
  // });
};

run();
