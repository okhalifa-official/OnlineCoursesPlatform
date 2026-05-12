/**
 * One-shot cleanup: strip every heavy base64 asset off existing courses so
 * the platform loads fast without changing the original code paths.
 *
 *   Clears:
 *     - course.materials (the entire array — every PDF blob)
 *     - course.previewVideoFile  +  course.previewVideoName
 *     - course.previewVideoURL  (only if the URL is empty/missing — kept otherwise)
 *     - every lesson's videoFile inside course.modules[].lessons[]
 *     - course.courseFilesNames  +  course.lessonAssetsNames  (legacy lists)
 *
 *   Preserved:
 *     - previewImage  (relatively small, kept so cards still show banners)
 *     - previewVideoURL  (YouTube / Vimeo links — no payload)
 *     - lesson.videoURL  (YouTube / Vimeo links — no payload)
 *
 *   Usage (from the server/ directory):
 *     node scripts/clearHeavyAssets.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("../Models/course");

async function main() {
  const uri = process.env.DB || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("DB (or MONGO_URI / MONGODB_URI) is not set in server/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const result = await Course.updateMany(
    {},
    {
      $set: {
        materials: [],
        previewVideoFile: "",
        previewVideoName: "",
        courseFilesNames: [],
        lessonAssetsNames: [],
        "modules.$[].lessons.$[].videoFile": "",
      },
    }
  );

  console.log(
    `Cleared heavy assets on ${result.modifiedCount} of ${result.matchedCount} course(s)`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
