---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / core/utils/initializers

# Module: core/utils/initializers

## Table of contents

### Functions

- [gen](/docs/modules/core_utils_initializers#gen)
- [pool](/docs/modules/core_utils_initializers#pool)
- [required](/docs/modules/core_utils_initializers#required)

## Functions

### gen

▸ **gen**(`generator`): `Object`

Provides a generator function to produce a value for an input.

#### Parameters

| Name | Type |
| :------ | :------ |
| `generator` | () => `any` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `[nodeValueIdentifier]` | [`NodeValue`](/docs/enums/core_inputNode.NodeValue) |
| `generator` | () => `any` |

#### Defined in

[src/core/utils/initializers.ts:11](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/utils/initializers.ts#L11)

___

### pool

▸ **pool**(`valuePool`): `Object`

Defines a set of values to choose from when constructing an input.

#### Parameters

| Name | Type |
| :------ | :------ |
| `valuePool` | `any`[] |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `[nodeValueIdentifier]` | [`NodeValue`](/docs/enums/core_inputNode.NodeValue) |
| `valuePool` | `any`[] |

#### Defined in

[src/core/utils/initializers.ts:5](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/utils/initializers.ts#L5)

___

### required

▸ **required**(): `Object`

Used to mark a param without a default value
as required to be taken from another source.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `[nodeValueIdentifier]` | [`NodeValue`](/docs/enums/core_inputNode.NodeValue) |

#### Defined in

[src/core/utils/initializers.ts:18](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/utils/initializers.ts#L18)
