---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / core/sourceNode

# Module: core/sourceNode

## Table of contents

### Interfaces

- [SourceNode](/docs/interfaces/core_sourceNode.SourceNode)

### Variables

- [SourceNodeHandler](/docs/modules/core_sourceNode#sourcenodehandler)

### Functions

- [sourceNode](/docs/modules/core_sourceNode#sourcenode)

## Variables

### SourceNodeHandler

• `Const` **SourceNodeHandler**: `Object`

Generates proxies recursively to handle nested property access of a source signature.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `get` | (`obj`: `RawSourceNode`, `prop`: `any`) => `any` |
| `set` | (`obj`: `RawSourceNode`, `prop`: `any`, `val`: `any`) => `any` |

#### Defined in

[src/core/sourceNode.ts:25](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/sourceNode.ts#L25)

## Functions

### sourceNode

▸ **sourceNode**(`hash`): [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)

Creates a new Source Node with the given hash.

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

#### Returns

[`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)

#### Defined in

[src/core/sourceNode.ts:5](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/sourceNode.ts#L5)
