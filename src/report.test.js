const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("Sample Tests", () => {
  it("should pass a basic test", () => {
    assert.strictEqual(1 + 1, 2);
  });

  it("should demonstrate string assertion", () => {
    const result = "hello world";
    assert.ok(result.includes("world"));
  });
});

// TODO: Add your actual tests here
