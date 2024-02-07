---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / core/utils/link

# Module: core/utils/link

## Table of contents

### Functions

- [allowUndefined](/docs/modules/core_utils_link#allowundefined)
- [link](/docs/modules/core_utils_link#link)
- [linkMany](/docs/modules/core_utils_link#linkmany)

## Functions

### allowUndefined

▸ **allowUndefined**(`source`): [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)

Modifier function that allows a SourceNode to return `undefined` values to an input node.
Note that doing so will make it such that this SourceNode will ALWAYS be used to retrieve
a value for any linked input node, unless there is another SourceNode with higher priority.

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode) |

#### Returns

[`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)

#### Defined in

[src/core/utils/link.ts:34](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/utils/link.ts#L34)

___

### link

▸ **link**(`dest`, `source`, `callback?`): `void`

Link a Source node to a Input node.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dest` | [`InputNode`](/docs/classes/core_inputNode.InputNode) | the input node that should take a value from a source. |
| `source` | [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode) | the source node that will provide the value for a input. |
| `callback?` | (`val`: `any`) => `any` | an optional function that is called on the source source value. |

#### Returns

`void`

#### Defined in

[src/core/utils/link.ts:11](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/utils/link.ts#L11)

___

### linkMany

▸ **linkMany**(`dest`, `sources`, `callback`): `void`

Links multiple Source nodes to a Input node via a callback.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dest` | [`InputNode`](/docs/classes/core_inputNode.InputNode) | the input node that should take a value from the callback. |
| `sources` | `Object` | an array of source nodes that will be passed into the callback. |
| `callback` | (`val`: `any`) => `any` | a function to merge the sources into a single source for the dest. |

#### Returns

`void`

#### Defined in

[src/core/utils/link.ts:21](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/utils/link.ts#L21)
