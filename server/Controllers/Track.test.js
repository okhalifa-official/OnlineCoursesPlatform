const test = require("node:test");
const assert = require("node:assert/strict");

const { buildUniqueSlug } = require("./Track");
const Track = require("../Models/Track");

test("buildUniqueSlug returns the plain slug when there is no collision", async (t) => {
  const original = Track.findOne;
  Track.findOne = async () => null;
  t.after(() => { Track.findOne = original; });

  const slug = await buildUniqueSlug("Basic POCUS");

  assert.equal(slug, "basic-pocus");
});

test("buildUniqueSlug appends -2 when the plain slug is taken", async (t) => {
  const original = Track.findOne;
  let callCount = 0;
  Track.findOne = async (query) => {
    callCount += 1;
    // First call: "basic-pocus" is taken. Second call: "basic-pocus-2" is free.
    if (callCount === 1 && query.slug === "basic-pocus") return { _id: "existing-id" };
    return null;
  };
  t.after(() => { Track.findOne = original; });

  const slug = await buildUniqueSlug("Basic POCUS");

  assert.equal(slug, "basic-pocus-2");
});

test("buildUniqueSlug excludes the current track's own id from the collision check", async (t) => {
  const original = Track.findOne;
  const queries = [];
  Track.findOne = async (query) => {
    queries.push(query);
    return null;
  };
  t.after(() => { Track.findOne = original; });

  await buildUniqueSlug("Basic POCUS", "track-being-edited-id");

  assert.equal(queries[0].slug, "basic-pocus");
  assert.deepEqual(queries[0]._id, { $ne: "track-being-edited-id" });
});
