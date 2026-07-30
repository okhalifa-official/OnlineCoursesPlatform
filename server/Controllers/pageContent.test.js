const test = require("node:test");
const assert = require("node:assert/strict");

const { validatePageData } = require("./pageContent");

test("landing pageKey is never validated by validatePageData (uses hero/sections, not pageData)", () => {
  assert.equal(validatePageData("landing", {}), null);
});

test("mission-vision requires mission and vision", () => {
  assert.equal(
    validatePageData("mission-vision", { vision: { body: "x" } }),
    "Mission is required"
  );
  assert.equal(
    validatePageData("mission-vision", { mission: { body: "x" } }),
    "Vision is required"
  );
  assert.equal(
    validatePageData("mission-vision", {
      mission: { body: "x" },
      vision: { body: "y" },
    }),
    null
  );
});

test("board-of-directors and mena-board require a non-empty members array", () => {
  assert.equal(
    validatePageData("board-of-directors", { members: [] }),
    "At least one member is required"
  );
  assert.equal(
    validatePageData("mena-board", { members: [{ name: "A" }] }),
    null
  );
});

test("scientific-committee requires a non-empty countries array", () => {
  assert.equal(
    validatePageData("scientific-committee", { countries: [] }),
    "At least one country is required"
  );
  assert.equal(
    validatePageData("scientific-committee", {
      countries: [{ name: "Egypt", members: [] }],
    }),
    null
  );
});

test("clinical-advisors requires a non-empty advisors array", () => {
  assert.equal(
    validatePageData("clinical-advisors", { advisors: [] }),
    "At least one advisor is required"
  );
});

test("business-partners and scientific-partners require a non-empty partners array", () => {
  assert.equal(
    validatePageData("business-partners", {}),
    "At least one partner is required"
  );
  assert.equal(
    validatePageData("scientific-partners", { partners: [{ name: "X" }] }),
    null
  );
});

test("policies requires a non-empty policies array", () => {
  assert.equal(
    validatePageData("policies", { policies: [] }),
    "At least one policy is required"
  );
});

test("an unrecognized pageKey is not validated (returns null)", () => {
  assert.equal(validatePageData("some-future-page", {}), null);
});

test("scientific-committee does not deep-validate that each country has a members array (documents why the frontend must guard g.members)", () => {
  assert.equal(
    validatePageData("scientific-committee", {
      countries: [{ name: "Egypt" }],
    }),
    null
  );
});

test("policies does not deep-validate that each policy has a sections array (documents why the frontend must guard current.sections)", () => {
  assert.equal(
    validatePageData("policies", {
      policies: [{ title: "T", slug: "s" }],
    }),
    null
  );
});
