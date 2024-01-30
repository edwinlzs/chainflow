# Dependencies

## Intent

This document track the purposes of dependencies to facilitate removal/swapping out packages whenever appropriate.

### Project Management

1. `commitlint`: lint commit messages
2. `eslint`: lint code
3. `prettier`: format code
4. `markdownlint`: lint markdown
5. `husky`: git hooks

### Functionality

1. `debug`: logging
2. `undici`: performant HTTP/1.1 client for node
3. `@fastify/deepmerge`: performant deep object merge functionality

### Testing

1. `jest`: a simple testing framework
2. `ts-jest`: jest transformer that allows using Jest with TypeScript without directly managing Babel dependencies
