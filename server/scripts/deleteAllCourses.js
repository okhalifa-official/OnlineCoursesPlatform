/**
 * One-shot wipe: deletes every course in the database, plus the records
 * that reference courses (enrollments, reviews) so nothing is orphaned.
 *
 *   Usage (from the server/ directory):
 *     node scripts/deleteAllCourses.js
 *
 * IRREVERSIBLE — there is no soft-delete here. Run only when you intend
 * to start over with a clean catalogue.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Course = require("../Models/course");
const Enrollment = require("../Models/enrollment");
const Review = require("../Models/review");

async function main() {
  const uri = process.env.DB || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("DB (or MONGO_URI / MONGODB_URI) is not set in server/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const enrollments = await Enrollment.deleteMany({});
  console.log(`Deleted ${enrollments.deletedCount} enrollment(s)`);

  const reviews = await Review.deleteMany({});
  console.log(`Deleted ${reviews.deletedCount} review(s)`);

  const courses = await Course.deleteMany({});
  console.log(`Deleted ${courses.deletedCount} course(s)`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
