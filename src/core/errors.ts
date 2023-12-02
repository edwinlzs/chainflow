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
  constructor() {
    super('Response is invalid or not currently handled by Chainflow.');
    this.name = 'InvalidResponseError';
  }
}
