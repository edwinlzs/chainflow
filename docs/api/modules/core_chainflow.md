---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / core/chainflow

# Module: core/chainflow

## Table of contents

### Classes

- [Chainflow](/docs/classes/core_chainflow.Chainflow)

### Interfaces

- [CallOpts](/docs/interfaces/core_chainflow.CallOpts)
- [CallResult](/docs/interfaces/core_chainflow.CallResult)
- [IEndpoint](/docs/interfaces/core_chainflow.IEndpoint)
- [RunOpts](/docs/interfaces/core_chainflow.RunOpts)

### Variables

- [seed](/docs/modules/core_chainflow#seed)
- [store](/docs/modules/core_chainflow#store)

### Functions

- [chainflow](/docs/modules/core_chainflow#chainflow)

## Variables

### seed

• `Const` **seed**: [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)

Special object used to link an InputNode to a chainflow seed.

#### Defined in

[src/core/chainflow.ts:45](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L45)

___

### store

• `Const` **store**: [`SourceNode`](/docs/interfaces/core_sourceNode.SourceNode)

Special object that acts as a central "gateway" between input and source values.

#### Defined in

[src/core/chainflow.ts:48](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L48)

## Functions

### chainflow

▸ **chainflow**(): [`Chainflow`](/docs/classes/core_chainflow.Chainflow)

#### Returns

[`Chainflow`](/docs/classes/core_chainflow.Chainflow)

#### Defined in

[src/core/chainflow.ts:112](https://github.com/edwinlzs/chainflow/blob/d682462/src/core/chainflow.ts#L112)
