---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / http/utils/client

# Module: http/utils/client

## Table of contents

### Type Aliases

- [SUPPORTED\_METHOD\_UPPERCASE](/docs/modules/http_utils_client#supported_method_uppercase)

### Variables

- [default](/docs/modules/http_utils_client#default)
- [defaultHeaders](/docs/modules/http_utils_client#defaultheaders)

## Type Aliases

### SUPPORTED\_METHOD\_UPPERCASE

Ƭ **SUPPORTED\_METHOD\_UPPERCASE**: ``"GET"`` \| ``"POST"`` \| ``"PUT"`` \| ``"DELETE"`` \| ``"PATCH"`` \| ``"OPTIONS"``

#### Defined in

[src/http/utils/client.ts:4](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/utils/client.ts#L4)

## Variables

### default

• **default**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `httpReq` | (`__namedParameters`: \{ `addr`: `string` ; `body?`: `any` ; `headers?`: `Record`\<`string`, `string`\> ; `method`: [`SUPPORTED_METHOD_UPPERCASE`](/docs/modules/http_utils_client#supported_method_uppercase) ; `path`: `string`  }) => `Promise`\<``null`` \| `ResponseData`\> |

#### Defined in

[src/http/utils/client.ts:52](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/utils/client.ts#L52)

___

### defaultHeaders

• `Const` **defaultHeaders**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `accept` | `string` |
| `connection` | `string` |
| `content-type` | `string` |

#### Defined in

[src/http/utils/client.ts:6](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/utils/client.ts#L6)
