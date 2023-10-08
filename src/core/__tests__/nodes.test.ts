import { describe, it } from "node:test";
import { ReqNode, ResNode } from "../nodes";
import assert from "node:assert";

describe("#nodes", () => {
  const testVal = {
    id: "some-id",
    name: "some-name",
    details: {
      age: 42,
      member: true,
    },
  };

  describe("creating a ReqNode", () => {
    describe("when the node value is not an object", () => {
      it("should save the value as the default", () => {
        const testNode = new ReqNode({ val: 40, hash: "some-hash" });
        assert.equal(testNode._hash, "some-hash");
        assert.equal(testNode._default, 40);
      });
    });

    describe("when the node value is an object", () => {
      const testNode = new ReqNode({ val: testVal, hash: "some-hash" });
      it("should save the object info within the node", () => {
        assert.ok(testNode._object);
      });

      it("should reconstruct the object as node value", () => {
        assert.deepEqual(testNode.getNodeValue({}), testVal);
      });
    });
  });

  describe("creating a ResNode", () => {
    it("should save the object path to access the node", () => {
      const testNode = new ResNode({ val: testVal, hash: "some-hash", path: "some-path" });
      assert.equal(testNode._path, "some-path");
    });
  })
});
