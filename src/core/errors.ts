/** When a value with an unsupported type is passed into a `ReqNode`. */
export class UnsupportedTypeError extends Error {
  constructor(unsupportedType: string) {
    super(`Value with type: "${unsupportedType}" is not supported.`);
    this.name = 'UnsupportedTypeError';
  }
}

/** When an unsupported method is passed into an `Endpoint`. */
export class UnsupportedMethodError extends Error {
  constructor(unsupportedMethod: string) {
    super(`Method "${unsupportedMethod}" is not supported.`);
    this.name = 'UnsupportedMethodError';
  }
}
