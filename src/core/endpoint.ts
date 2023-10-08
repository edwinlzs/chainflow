import { hashEndpoint } from "../utils/hash.js";
import { Responses } from "./chainflow.js";
import { ReqNode, ResNode } from "./nodes.js";
import debug from "debug";

const log = debug("endpoint");

export type ReqNodes = { [nodeName: string]: ReqNode };

export class Endpoint {
  _route: string;
  _method: string;
  _req: { [key: string]: ReqNode } = {};
  _res: { [key: string]: ResNode } = {};

  constructor({ route, method }: { route: string; method: string }) {
    this._route = route;
    this._method = method;
  }

  getHash() {
    return hashEndpoint({ route: this._route, method: this._method });
  }

  get req() {
    return this._req;
  }

  set req(payload: any) {
    const hash = this.getHash();
    Object.entries(payload).forEach(([key, val]) => {
      log(`Creating ReqNode for hash "${hash}" with key "${key}"`);
      this._req[key] = new ReqNode({
        val,
        hash,
      });
    });
  }

  get res() {
    return this._res;
  }

  set res(payload: any) {
    const hash = this.getHash();
    Object.entries(payload).forEach(([key, val]) => {
      log(`Creating ResNode for hash "${hash}" with path "${key}"`);
      this._res[key] = new ResNode({
        val,
        hash,
        path: key,
      });
    });
  }

  /** Calls this endpoint with provided responses */
  async call(responses: any): Promise<any> {
    const payload = this.#constructPayload(responses);
    log(
      `Calling API with hash "${this.getHash()}" and payload ${JSON.stringify(payload)}`
    );
    // await fetch(this.hash.route, {
    //   method: this.hash.method,
    //   body: JSON.stringify(payload),
    // });
    return payload;
  }

  /** Configure linking of this Req's nodes */
  set(
    setter: (
      link: (dest: ReqNode, source: ResNode) => void,
      nodes: ReqNodes
    ) => void
  ) {
    setter(link, this._req);
  }

  /** Constructs the request payload */
  #constructPayload(responses: Responses) {
    return Object.entries(this._req).reduce((acc, [key, val]) => {
      acc[key] = getNodeValue(val as ReqNode, responses);
      return acc;
    }, {} as any);
  }
}

/** Retrieve value of a node */
const getNodeValue = (val: ReqNode, responses: Responses) => {
  const endpointHash = getSourceHash(val, responses);
  if (endpointHash) {
    const resPath = val._sources[endpointHash]!;
    const resPayload = responses[endpointHash]![0];

    log(
      `Retrieving value for ReqNode with hash "${
        val._hash
      }" from response payload ${JSON.stringify(
        resPayload
      )} via path "${resPath}"`
    );

    const resVal = accessSource(resPayload, resPath);

    if (resVal) {
      return resVal;
    }
  }

  return val._default;
};

/** Retrieves a matching endpoint hash from this node's sources, if any */
const getSourceHash = (node: ReqNode, responses: Responses) => {
  const sourceEndpointHashes = Object.keys(node._sources);
  const availEndpointHashes = Object.keys(responses);
  return sourceEndpointHashes.find((hash) =>
    availEndpointHashes.includes(hash)
  );
};

/** Access the source node value in a response payload */
const accessSource = (payload: any, path: string): any => {
  const accessors = path.split(".");
  let resVal = payload;

  if (!accessors) {
    return null;
  }

  let i = 0;
  while (i < accessors.length && resVal) {
    let accessor = accessors[i]!;
    resVal = resVal[accessor];
    i += 1;
  }

  return resVal;
};

/** Link a Response node to a Request node */
const link = (dest: ReqNode, source: ResNode) => {
  dest._sources[source._hash] = source._path;
  log(
    `Linked ResNode with hash "${source._hash}" and path "${source._path}" to ReqNode with hash "${dest._hash}"`
  );
};
