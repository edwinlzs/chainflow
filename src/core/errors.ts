/** When an unsupported method is passed into an `Endpoint`. */
export class UnsupportedMethodError extends Error {
  constructor(unsupportedMethod: string) {
    super(`Method "${unsupportedMethod}" is not supported.`);
    this.name = 'UnsupportedMethodError';
  }
}

/** When there is no value available for a required input node. */
export class RequiredValueNotFoundError extends Error {
  constructor(hash: string) {
    super(`Required value not available for Endpoint with hash "${hash}".`);
    this.name = 'RequiredValueNotFoundError';
  }
}

export class InvalidResponseError extends Error {
  constructor() {
    super('Response is invalid or not currently handled by Chainflow.');
    this.name = 'InvalidResponseError';
  }
}
