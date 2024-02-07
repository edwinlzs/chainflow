---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / [http/endpoint](/docs/modules/http_endpoint) / EndpointConfig

# Interface: EndpointConfig

[http/endpoint](/docs/modules/http_endpoint).EndpointConfig

Configurations for the endpoint.

## Table of contents

### Properties

- [respParser](/docs/interfaces/http_endpoint.EndpointConfig#respparser)
- [respValidator](/docs/interfaces/http_endpoint.EndpointConfig#respvalidator)

## Properties

### respParser

• `Optional` **respParser**: ``"arrayBuffer"`` \| ``"blob"`` \| ``"json"`` \| ``"text"``

#### Defined in

[src/http/endpoint.ts:39](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/endpoint.ts#L39)

___

### respValidator

• `Optional` **respValidator**: (`resp`: `ResponseData`) => \{ `msg?`: `string` ; `valid`: `boolean`  }

#### Type declaration

▸ (`resp`): `Object`

##### Parameters

| Name | Type |
| :------ | :------ |
| `resp` | `ResponseData` |

##### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `msg?` | `string` |
| `valid` | `boolean` |

#### Defined in

[src/http/endpoint.ts:40](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/endpoint.ts#L40)
