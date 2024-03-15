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

export const flow2 = chainflow().call(createUser).call(getUser).call(createRole);

export const someOtherFlow = chainflow()
  .call(createProject)
  .call(createSubmission)
  .call(getSubmission);

export const yetAnotherFlow = chainflow().call(createSubmission).call(getSubmission);

export const flow5 = chainflow().call(createSubmission).call(getSubmission);

export const flow99 = chainflow().call(createSubmission).call(getSubmission);

export const flow200 = chainflow().call(createSubmission).call(getSubmission);
