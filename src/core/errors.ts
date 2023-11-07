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

/** When the path to access a source node value is not defined. */
export class MissingSourcePathError extends Error {
  constructor(sourceHash: string) {
    super(
      `Expected a path to be defined to access a source value with endpoint hash "${sourceHash}".`,
    );
    this.name = 'MissingSourcePathError';
  }
}

/** When the sources for a multi-source node value is not defined. */
export class MissingSourcesError extends Error {
  constructor(sourceHash: string) {
    super(
      `Expected a path to be defined to access source values with combined endpoint hash "${sourceHash}".`,
    );
    this.name = 'MissingSourcesError';
  }
}
