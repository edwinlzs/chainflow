/** When there is no value available for a required input node. */
export class RequiredValuesNotFoundError extends Error {
  constructor(id: string, missingValues: string[]) {
    super(
      `Endpoint with id "${id}" is missing required values with these paths: ${missingValues.join(
        ', ',
      )}`,
    );
    this.name = 'RequiredValuesNotFoundError';
  }
}

/** When a request to an endpoint fails to execute or receive a response. */
export class RequestFailedError extends Error {
  constructor(msg?: string) {
    super(`Request failed: ${msg}`);
    this.name = 'RequestFailedError';
  }
}

/** When a response fails a validation check. */
export class InvalidResponseError extends Error {
  constructor(msg?: string) {
    super(
      `Response is invalid: ${msg ?? '[No error message is configured for this validation error]'}`,
    );
    this.name = 'InvalidResponseError';
  }
}
/** When the client fails to parse a response body. */
export class ParseResponseError extends Error {
  constructor(msg?: string) {
    super(`Failed to parse response: ${msg}`);
    this.name = 'ParseResponseError';
  }
}
