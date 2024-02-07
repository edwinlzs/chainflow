---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / [core/chainflow](/docs/modules/core_chainflow) / Chainflow

# Class: Chainflow

[core/chainflow](/docs/modules/core_chainflow).Chainflow

## Table of contents

### Constructors

- [constructor](/docs/classes/core_chainflow.Chainflow#constructor)

### Properties

- [#callstack](/docs/classes/core_chainflow.Chainflow##callstack)
- [#sources](/docs/classes/core_chainflow.Chainflow##sources)

### Methods

- [call](/docs/classes/core_chainflow.Chainflow#call)
- [clone](/docs/classes/core_chainflow.Chainflow#clone)
- [extend](/docs/classes/core_chainflow.Chainflow#extend)
- [reset](/docs/classes/core_chainflow.Chainflow#reset)
- [run](/docs/classes/core_chainflow.Chainflow#run)

## Constructors

### constructor

• **new Chainflow**(): [`Chainflow`](/docs/classes/core_chainflow.Chainflow)

#### Returns

[`Chainflow`](/docs/classes/core_chainflow.Chainflow)

## Properties

### #callstack

• `Private` **#callstack**: `Callstack` = `[]`

#### Defined in

[src/core/chainflow.ts:56](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L56)

___

### #sources

• `Private` **#sources**: [`SourceValues`](/docs/modules/core_inputNode#sourcevalues)

Stores sources such as the seed or values accumulated from
endpoint calls in the current flow.

#### Defined in

[src/core/chainflow.ts:53](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L53)

## Methods

### call

▸ **call**(`endpoint`, `opts?`): [`Chainflow`](/docs/classes/core_chainflow.Chainflow)

Adds an endpoint call to the callchain.

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`IEndpoint`](/docs/interfaces/core_chainflow.IEndpoint) |
| `opts?` | [`CallOpts`](/docs/interfaces/core_chainflow.CallOpts) |

#### Returns

[`Chainflow`](/docs/classes/core_chainflow.Chainflow)

#### Defined in

[src/core/chainflow.ts:87](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L87)

___

### clone

▸ **clone**(): [`Chainflow`](/docs/classes/core_chainflow.Chainflow)

Creates a clone of this chainflow and its callstack
 which can be extended and run independently.

#### Returns

[`Chainflow`](/docs/classes/core_chainflow.Chainflow)

#### Defined in

[src/core/chainflow.ts:99](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L99)

___

### extend

▸ **extend**(`cf`): [`Chainflow`](/docs/classes/core_chainflow.Chainflow)

Extends this chainflow's callstack with that of another flow.

#### Parameters

| Name | Type |
| :------ | :------ |
| `cf` | [`Chainflow`](/docs/classes/core_chainflow.Chainflow) |

#### Returns

[`Chainflow`](/docs/classes/core_chainflow.Chainflow)

#### Defined in

[src/core/chainflow.ts:106](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L106)

___

### reset

▸ **reset**(): `void`

Resets the chainflow's state by clearing its accumulated sources.

#### Returns

`void`

#### Defined in

[src/core/chainflow.ts:93](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L93)

___

### run

▸ **run**(`opts?`): `Promise`\<[`SourceValues`](/docs/modules/core_inputNode#sourcevalues)\>

Run the set up chain

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts?` | [`RunOpts`](/docs/interfaces/core_chainflow.RunOpts) |

#### Returns

`Promise`\<[`SourceValues`](/docs/modules/core_inputNode#sourcevalues)\>

#### Defined in

[src/core/chainflow.ts:59](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L59)
