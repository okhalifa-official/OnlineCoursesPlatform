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

  const distinctCategories = [
    ...new Set(toMigrate.map((c) => (c.category || "General").trim() || "General")),
  ];

  const existingTracks = await Track.find({
    name: { $in: distinctCategories },
  });
  const trackIdByName = new Map(
    existingTracks.map((t) => [t.name, t._id])
  );

  const usedSlugs = new Set(
    (await Track.find({}).select("slug")).map((t) => t.slug)
  );

  let tracksCreated = 0;

  for (const name of distinctCategories) {
    if (trackIdByName.has(name)) continue;

    const slug = await buildUniqueSlugForMigration(name, usedSlugs);
    const track = await Track.create({ name, slug });
    trackIdByName.set(name, track._id);
    tracksCreated += 1;
  }

  let coursesMigrated = 0;

  for (const course of toMigrate) {
    const categoryName = (course.category || "General").trim() || "General";
    const trackId = trackIdByName.get(categoryName);

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
