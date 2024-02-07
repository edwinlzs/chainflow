---
layout: /src/layouts/docs/DocsLayout.astro
---

[chainflow](/docs/README) / [Modules](/docs/modules) / http/originServer

# Module: http/originServer

## Table of contents

### Type Aliases

- [Origin](/docs/modules/http_originServer#origin)

### Functions

- [originServer](/docs/modules/http_originServer#originserver)

## Type Aliases

### Origin

Ƭ **Origin**: `OriginBase` & \{ `delete`: `MakeEndpoint` ; `get`: `MakeEndpoint` ; `options`: `MakeEndpoint` ; `patch`: `MakeEndpoint` ; `post`: `MakeEndpoint` ; `put`: `MakeEndpoint`  }

#### Defined in

[src/http/originServer.ts:11](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/originServer.ts#L11)

## Functions

### originServer

▸ **originServer**(`addr?`): [`Origin`](/docs/modules/http_originServer#origin)

Convenience function for creating an endpoint builder with supported methods defined on it.

#### Parameters

| Name | Type |
| :------ | :------ |
| `addr?` | `string` |

#### Returns

[`Origin`](/docs/modules/http_originServer#origin)

#### Defined in

[src/http/originServer.ts:6](https://github.com/edwinlzs/chainflow/blob/d682462/src/http/originServer.ts#L6)
