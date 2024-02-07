---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / core/utils/source

# Module: core/utils/source

## Table of contents

### Functions

- [source](/docs/modules/core_utils_source#source)
- [sources](/docs/modules/core_utils_source#sources)

## Functions

### source

▸ **source**(`source`, `callback?`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode) |
| `callback?` | (`val`: `any`) => `any` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `[nodeValueIdentifier]` | [`NodeValue`](/docs/enums/core_inputNode.NodeValue) |
| `callback` | `undefined` \| (`val`: `any`) => `any` |
| `source` | [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode) |

#### Defined in

[src/core/utils/source.ts:5](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/utils/source.ts#L5)

___

### sources

▸ **sources**(`sources`, `callback?`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `sources` | [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)[] |
| `callback?` | (`val`: `any`) => `any` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `[nodeValueIdentifier]` | [`NodeValue`](/docs/enums/core_inputNode.NodeValue) |
| `callback` | `undefined` \| (`val`: `any`) => `any` |
| `sources` | [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)[] |

#### Defined in

[src/core/utils/source.ts:11](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/utils/source.ts#L11)
