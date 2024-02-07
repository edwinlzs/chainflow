---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / [http/reqBuilder](/docs/modules/http_reqBuilder) / ReqBuilder

# Class: ReqBuilder

[http/reqBuilder](/docs/modules/http_reqBuilder).ReqBuilder

Contains node definitions for a request.

## Table of contents

### Constructors

- [constructor](/docs/classes/http_reqBuilder.ReqBuilder#constructor)

### Properties

- [#body](/docs/classes/http_reqBuilder.ReqBuilder##body)
- [#hash](/docs/classes/http_reqBuilder.ReqBuilder##hash)
- [#headers](/docs/classes/http_reqBuilder.ReqBuilder##headers)
- [#queryParams](/docs/classes/http_reqBuilder.ReqBuilder##queryparams)
- [baseHeaders](/docs/classes/http_reqBuilder.ReqBuilder#baseheaders)
- [pathParams](/docs/classes/http_reqBuilder.ReqBuilder#pathparams)

### Accessors

- [body](/docs/classes/http_reqBuilder.ReqBuilder#body)
- [headers](/docs/classes/http_reqBuilder.ReqBuilder#headers)
- [query](/docs/classes/http_reqBuilder.ReqBuilder#query)

## Constructors

### constructor

• **new ReqBuilder**(`«destructured»`): [`ReqBuilder`](/docs/classes/http_reqBuilder.ReqBuilder)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `hash` | `string` |

#### Returns

[`ReqBuilder`](/docs/classes/http_reqBuilder.ReqBuilder)

#### Defined in

[src/http/reqBuilder.ts:12](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L12)

## Properties

### #body

• `Private` **#body**: [`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Defined in

[src/http/reqBuilder.ts:9](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L9)

___

### #hash

• `Private` **#hash**: `string`

#### Defined in

[src/http/reqBuilder.ts:10](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L10)

___

### #headers

• `Private` **#headers**: [`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Defined in

[src/http/reqBuilder.ts:6](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L6)

___

### #queryParams

• `Private` **#queryParams**: [`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Defined in

[src/http/reqBuilder.ts:8](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L8)

___

### baseHeaders

• **baseHeaders**: [`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Defined in

[src/http/reqBuilder.ts:5](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L5)

___

### pathParams

• **pathParams**: [`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Defined in

[src/http/reqBuilder.ts:7](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L7)

## Accessors

### body

• `get` **body**(): [`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Returns

[`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Defined in

[src/http/reqBuilder.ts:21](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L21)

• `set` **body**(`payload`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `payload` | `any` |

#### Returns

`void`

#### Defined in

[src/http/reqBuilder.ts:25](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L25)

___

### headers

• `get` **headers**(): [`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Returns

[`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Defined in

[src/http/reqBuilder.ts:43](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L43)

• `set` **headers**(`params`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `any` |

#### Returns

`void`

#### Defined in

[src/http/reqBuilder.ts:47](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L47)

___

### query

• `get` **query**(): [`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Returns

[`InputNode`](/docs/classes/core_inputNode.InputNode)

#### Defined in

[src/http/reqBuilder.ts:32](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L32)

• `set` **query**(`params`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `any` |

#### Returns

`void`

#### Defined in

[src/http/reqBuilder.ts:36](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/reqBuilder.ts#L36)
