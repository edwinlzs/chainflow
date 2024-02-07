---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / [http/errors](/docs/modules/http_errors) / InvalidResponseError

# Class: InvalidResponseError

[http/errors](/docs/modules/http_errors).InvalidResponseError

## Hierarchy

- `Error`

  ↳ **`InvalidResponseError`**

## Table of contents

### Constructors

- [constructor](/docs/classes/http_errors.InvalidResponseError#constructor)

### Properties

- [cause](/docs/classes/http_errors.InvalidResponseError#cause)
- [message](/docs/classes/http_errors.InvalidResponseError#message)
- [name](/docs/classes/http_errors.InvalidResponseError#name)
- [stack](/docs/classes/http_errors.InvalidResponseError#stack)
- [prepareStackTrace](/docs/classes/http_errors.InvalidResponseError#preparestacktrace)
- [stackTraceLimit](/docs/classes/http_errors.InvalidResponseError#stacktracelimit)

### Methods

- [captureStackTrace](/docs/classes/http_errors.InvalidResponseError#capturestacktrace)

## Constructors

### constructor

• **new InvalidResponseError**(`msg?`): [`InvalidResponseError`](/docs/classes/http_errors.InvalidResponseError)

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg?` | `string` |

#### Returns

[`InvalidResponseError`](/docs/classes/http_errors.InvalidResponseError)

#### Overrides

Error.constructor

#### Defined in

[src/http/errors.ts:22](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/errors.ts#L22)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

Error.cause

#### Defined in

node_modules/.pnpm/typescript@5.3.3/node_modules/typescript/lib/lib.es2022.error.d.ts:24

___

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/.pnpm/typescript@5.3.3/node_modules/typescript/lib/lib.es5.d.ts:1076

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/.pnpm/typescript@5.3.3/node_modules/typescript/lib/lib.es5.d.ts:1075

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/.pnpm/typescript@5.3.3/node_modules/typescript/lib/lib.es5.d.ts:1077

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

Error.prepareStackTrace

#### Defined in

node_modules/.pnpm/@types+node@20.11.16/node_modules/@types/node/globals.d.ts:28

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

node_modules/.pnpm/@types+node@20.11.16/node_modules/@types/node/globals.d.ts:30

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

node_modules/.pnpm/@types+node@20.11.16/node_modules/@types/node/globals.d.ts:21
