---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / [core/chainflow](/docs/modules/core_chainflow) / IEndpoint

# Interface: IEndpoint

[core/chainflow](/docs/modules/core_chainflow).IEndpoint

Defines an endpoint that a chainflow can call upon.

## Implemented by

- [`Endpoint`](/docs/classes/http_endpoint.Endpoint)

## Table of contents

### Properties

- [call](/docs/interfaces/core_chainflow.IEndpoint#call)
- [hash](/docs/interfaces/core_chainflow.IEndpoint#hash)

## Properties

### call

• **call**: (`sources`: [`SourceValues`](/docs/modules/core_inputNode#sourcevalues), `opts?`: [`CallOpts`](/docs/interfaces/core_chainflow.CallOpts)) => `Promise`\<[`CallResult`](/docs/interfaces/core_chainflow.CallResult)\>

#### Type declaration

▸ (`sources`, `opts?`): `Promise`\<[`CallResult`](/docs/interfaces/core_chainflow.CallResult)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `sources` | [`SourceValues`](/docs/modules/core_inputNode#sourcevalues) |
| `opts?` | [`CallOpts`](/docs/interfaces/core_chainflow.CallOpts) |

##### Returns

`Promise`\<[`CallResult`](/docs/interfaces/core_chainflow.CallResult)\>

#### Defined in

[src/core/chainflow.ts:21](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L21)

___

### hash

• **hash**: `string`

#### Defined in

[src/core/chainflow.ts:20](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L20)
