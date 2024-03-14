import { chainflow, enableLogs } from 'chainflow';
import {
  createProject,
  createRole,
  createSubmission,
  createUser,
  getSubmission,
  getUser,
} from './endpoints';

enableLogs();

// run the chainflows
export const basicFlow = chainflow()
  .call(createUser)
  .call(getUser)
  .call(createRole)
  .call(createProject)
  .call(createSubmission)
  .call(getSubmission);