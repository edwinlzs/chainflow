import { chainflow, enableLogs } from 'chainflow';
import {
  createProject,
  createRole,
  createSubmission,
  createUser,
  getSubmission,
  getUser,
} from './src/endpoints';

enableLogs();

// run the chainflows
const flow = chainflow()
  .call(createUser)
  .call(getUser)
  .call(createRole)
  .call(createProject)
  .call(createSubmission)
  .call(getSubmission);

flow.run();
