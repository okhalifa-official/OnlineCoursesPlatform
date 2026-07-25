require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Track = require("../Models/Track");
const { slugify } = require("../utils/slug");

async function buildUniqueSlugForMigration(name, usedSlugs) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  while (usedSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  usedSlugs.add(candidate);
  return candidate;
}

async function run() {
  await mongoose.connect(process.env.DB);

  const coursesCollection = mongoose.connection.db.collection("courses");

  const rawCourses = await coursesCollection
    .find({}, { projection: { category: 1, trackId: 1 } })
    .toArray();

  const alreadyMigrated = rawCourses.filter((c) => c.trackId).length;
  const toMigrate = rawCourses.filter((c) => !c.trackId);

  if (toMigrate.length === 0) {
    console.log(
      `Nothing to migrate: ${alreadyMigrated} course(s) already have a trackId.`
    );
    await mongoose.disconnect();
    return;
  }

  // Matching/deduping is case-insensitive (category was free-text with no admin UI
  // constraint, so "Radiology" and "radiology" must merge into a single Track).
  // The display name for a newly-created Track uses the FIRST-SEEN casing variant
  // for that case-insensitive key, in iteration order over `toMigrate` (the raw
  // courses array) — deterministic and simple to reason about.
  const nameByKey = new Map();
  for (const c of toMigrate) {
    const name = (c.category || "General").trim() || "General";
    const key = name.toLowerCase();
    if (!nameByKey.has(key)) {
      nameByKey.set(key, name);
    }
  }
  const distinctCategories = [...nameByKey.values()];

  // Fetch ALL existing tracks and match case-insensitively in JS. Simpler and more
  // obviously correct than a regex/collation query for a one-shot script.
  const existingTracks = await Track.find({});
  const trackIdByKey = new Map(
    existingTracks.map((t) => [t.name.toLowerCase(), t._id])
  );

  const usedSlugs = new Set(existingTracks.map((t) => t.slug));

  let tracksCreated = 0;

  for (const name of distinctCategories) {
    const key = name.toLowerCase();
    if (trackIdByKey.has(key)) continue;

    const slug = await buildUniqueSlugForMigration(name, usedSlugs);
    const track = await Track.create({ name, slug });
    trackIdByKey.set(key, track._id);
    tracksCreated += 1;
  }

  let coursesMigrated = 0;

  for (const course of toMigrate) {
    const categoryName = (course.category || "General").trim() || "General";
    const trackId = trackIdByKey.get(categoryName.toLowerCase());

    await coursesCollection.updateOne(
      { _id: course._id },
      { $set: { trackId } }
    );

    coursesMigrated += 1;
  }

  console.log("Migration complete:", {
    tracksCreated,
    coursesMigrated,
    alreadyMigratedSkipped: alreadyMigrated,
  });

  await mongoose.disconnect();
}

run().catch(function (err) {
  console.error("Migration failed:", err);
  process.exit(1);
});
