import { terminal as term } from "terminal-kit";

export const safeLog = (_: string) => {
  // term.saveCursor().green(val);
  term(term.height);
}