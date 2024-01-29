/** When an unsupported method is passed into an `Endpoint`. */
export class UnsupportedMethodError extends Error {
  constructor(unsupportedMethod: string) {
    super(`Method "${unsupportedMethod}" is not supported.`);
    this.name = 'UnsupportedMethodError';
  }
}

/** When there is no value available for a required input node. */
export class RequiredValuesNotFoundError extends Error {
  constructor(hash: string, missingValues: string[]) {
    super(
      `Endpoint with hash "${hash}" is missing required values with these paths: ${missingValues.join(
        ', ',
      )}`,
    );
    this.name = 'RequiredValuesNotFoundError';
  }
}

export class InvalidResponseError extends Error {
  constructor(msg?: string) {
    super(
      `Response is invalid: ${msg ?? '[No error message is configured for this validation error]'}`,
    );
    this.name = 'InvalidResponseError';
  }
}
