---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / [http/errors](/docs/modules/http_errors) / RequiredValuesNotFoundError

# Class: RequiredValuesNotFoundError

[http/errors](/docs/modules/http_errors).RequiredValuesNotFoundError

When there is no value available for a required input node.

## Hierarchy

- `Error`

  ↳ **`RequiredValuesNotFoundError`**

## Table of contents

### Constructors

- [constructor](/docs/classes/http_errors.RequiredValuesNotFoundError#constructor)

### Properties

- [cause](/docs/classes/http_errors.RequiredValuesNotFoundError#cause)
- [message](/docs/classes/http_errors.RequiredValuesNotFoundError#message)
- [name](/docs/classes/http_errors.RequiredValuesNotFoundError#name)
- [stack](/docs/classes/http_errors.RequiredValuesNotFoundError#stack)
- [prepareStackTrace](/docs/classes/http_errors.RequiredValuesNotFoundError#preparestacktrace)
- [stackTraceLimit](/docs/classes/http_errors.RequiredValuesNotFoundError#stacktracelimit)

### Methods

- [captureStackTrace](/docs/classes/http_errors.RequiredValuesNotFoundError#capturestacktrace)

## Constructors

### constructor

• **new RequiredValuesNotFoundError**(`hash`, `missingValues`): [`RequiredValuesNotFoundError`](/docs/classes/http_errors.RequiredValuesNotFoundError)

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |
| `missingValues` | `string`[] |

#### Returns

[`RequiredValuesNotFoundError`](/docs/classes/http_errors.RequiredValuesNotFoundError)

#### Overrides

Error.constructor

#### Defined in

[src/http/errors.ts:11](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/errors.ts#L11)

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
