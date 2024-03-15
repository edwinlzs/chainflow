import { loadCf } from './utils/loadCf';
import { terminal as term } from 'terminal-kit';
import { handleDirections, renderMenu } from './utils/render';
import { safeLog } from './utils/log';

export const CHAINFLOWS_FILE = '../fixtures/index.ts';

const run = async () => {
  // term.on('terminal', (name: string, arg: unknown) => {
  //   if (name === 'CURSOR_LOCATION') {
  //     const location = arg as { x: number, y: number };
  //     term(location.x, location.y);
  //   }
  // }).requestCursorLocation().nextLine(1);

  const flows = await loadCf();
  term(`Loaded chainflows from ${CHAINFLOWS_FILE}:`).nextLine(1);

  // let selectedFlow: string | null = null;
  const flowNames = Object.keys(flows);

  let topRow = 0;
  let numRows = 5;
  let cursorIndex = 0;
  let flowNamesDisplayed = getDisplayRows(flowNames, topRow, numRows);

  const renderFlowsMenu = () =>
    renderMenu({
      options: flowNamesDisplayed,
      cursorIndex,
      title: 'CHAINFLOWS',
    });

  renderFlowsMenu();
  term.hideCursor().grabInput({});
  term.on('key', (name: string, _matches: unknown, _data: unknown) => {
    if (name === 'CTRL_C') term.processExit(0);

    const result = handleDirections(name, topRow, topRow + numRows, cursorIndex);
    cursorIndex = result.cursorIndex;
    if (result.scrollUp && topRow > 0) {
      topRow -= 1;
      flowNamesDisplayed = getDisplayRows(flowNames, topRow, numRows);
    } else if (result.scrollDown && flowNames.length > topRow + numRows - 1) {
      topRow += 1;
      flowNamesDisplayed = getDisplayRows(flowNames, topRow, numRows);
    }
    console.log(flowNames.length, topRow + numRows);
    renderFlowsMenu();
  });

  safeLog('');
};

const getDisplayRows = (rows: string[], topRow: number, numRows: number) => 
  rows.length > topRow + numRows ? rows.slice(topRow, topRow + numRows) : rows

run();
