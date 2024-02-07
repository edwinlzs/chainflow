---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / [core/store](/docs/modules/core_store) / Store

# Class: Store

[core/store](/docs/modules/core_store).Store

Manages the storing of values for an endpoint.

## Table of contents

### Constructors

- [constructor](/docs/classes/core_store.Store#constructor)

### Properties

- [#store](/docs/classes/core_store.Store##store)
- [def](/docs/classes/core_store.Store#def)

### Methods

- [#accessRespValue](/docs/classes/core_store.Store##accessrespvalue)
- [#getStoreValue](/docs/classes/core_store.Store##getstorevalue)
- [#putInStore](/docs/classes/core_store.Store##putinstore)
- [storeValues](/docs/classes/core_store.Store#storevalues)

## Constructors

### constructor

• **new Store**(): [`Store`](/docs/classes/core_store.Store)

#### Returns

[`Store`](/docs/classes/core_store.Store)

## Properties

### #store

• `Private` **#store**: [`IStore`](/docs/interfaces/core_store.IStore)\<`unknown`\> = `{}`

Actual store of values received

#### Defined in

[src/core/store.ts:15](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/store.ts#L15)

___

### def

• **def**: [`IStore`](/docs/interfaces/core_store.IStore)\<[`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)\> = `{}`

Definition of values to be stored from responses to this endpoint.

#### Defined in

[src/core/store.ts:13](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/store.ts#L13)

## Methods

### #accessRespValue

▸ **#accessRespValue**(`resp`, `storePath`, `source`): \{ `found`: `boolean` = true; `storePath`: `string`[] ; `value`: `unknown` = sourceVal } \| \{ `found`: `boolean` = false; `storePath`: `undefined` ; `value?`: `undefined` = sourceVal }

Use a storeDef's defined path to search for a value in the response object.

#### Parameters

| Name | Type |
| :------ | :------ |
| `resp` | `unknown` |
| `storePath` | `string`[] |
| `source` | [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode) |

#### Returns

\{ `found`: `boolean` = true; `storePath`: `string`[] ; `value`: `unknown` = sourceVal } \| \{ `found`: `boolean` = false; `storePath`: `undefined` ; `value?`: `undefined` = sourceVal }

#### Defined in

[src/core/store.ts:54](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/store.ts#L54)

___

### #getStoreValue

▸ **#getStoreValue**(`resp`, `currentPath`, `storeDef`): `void`

Looks for a value defined in the store definition.

#### Parameters

| Name | Type |
| :------ | :------ |
| `resp` | `unknown` |
| `currentPath` | `string`[] |
| `storeDef` | [`IStore`](/docs/interfaces/core_store.IStore)\<[`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)\> |

#### Returns

`void`

#### Defined in

[src/core/store.ts:36](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/store.ts#L36)

___

### #putInStore

▸ **#putInStore**(`storePath`, `value`): `void`

Places the found response value in the store according to the store path defined.

#### Parameters

| Name | Type |
| :------ | :------ |
| `storePath` | `string`[] |
| `value` | `unknown` |

#### Returns

`void`

#### Defined in

[src/core/store.ts:74](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/store.ts#L74)

___

### storeValues

▸ **storeValues**(`resp`): [`CallResult`](/docs/interfaces/core_chainflow.CallResult)

Assigns values to be put in the chainflow's store.

#### Parameters

| Name | Type |
| :------ | :------ |
| `resp` | `unknown` |

#### Returns

[`CallResult`](/docs/interfaces/core_chainflow.CallResult)

#### Defined in

[src/core/store.ts:18](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/store.ts#L18)
