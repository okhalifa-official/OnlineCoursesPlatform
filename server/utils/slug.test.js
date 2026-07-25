const test = require("node:test");
const assert = require("node:assert/strict");
const { slugify } = require("./slug");

test("lowercases and replaces spaces with hyphens", () => {
  assert.equal(slugify("Basic POCUS"), "basic-pocus");
});

test("collapses multiple non-alphanumeric characters into one hyphen", () => {
  assert.equal(slugify("Advanced  POCUS & Critical Care!!"), "advanced-pocus-critical-care");
});

test("trims leading and trailing hyphens", () => {
  assert.equal(slugify("  -Musculoskeletal US-  "), "musculoskeletal-us");
});

test("empty or whitespace-only input produces an empty string", () => {
  assert.equal(slugify(""), "");
  assert.equal(slugify("   "), "");
});
