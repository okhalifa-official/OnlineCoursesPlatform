# Course Tracks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every course belongs to an admin-managed "track" instead of a free-text category; the home page's "What we offer" section renders live tracks, and clicking one opens the courses page pre-filtered to that track.

**Architecture:** A new `Track` Mongoose collection (mirroring the existing `EducationalCenter` model/controller/router/admin-CRUD-pages pattern) becomes the single source of truth for course categorization, replacing `Course.category`. A one-time migration script backfills `trackId` on existing courses from their old `category` values. A shared public endpoint (`GET /api/public/tracks`) feeds both the home page's `TracksSection` and the courses-page filter, closing the loop between "click a track" and "see only that track's courses" via a `?track=<slug>` URL param.

**Tech Stack:** Node.js/Express/Mongoose (server), React 19 + Vite + React Router (client). Node's built-in `node:test` for backend tests (established in a prior feature); no frontend test framework exists — frontend changes are verified via `npm run build` and manual/live checks.

## Global Constraints

- Every course has exactly one track; `trackId` is a required field on `Course`.
- Deleting a track that still has courses assigned to it is blocked (409) with a clear message — never silently cascades.
- The home page's "What we offer" section (`TracksSection.jsx`) is fully replaced to render live from the `Track` collection — the static XML/CMS source is no longer used for this section.
- `Course.category` (free text) is removed from the schema; the three prior inconsistent hardcoded category vocabularies (`admin/pages/Courses.jsx`'s `getCategoryColor`, `user/pages/CoursesPage.jsx`'s `MEDICAL_SPECIALTIES`, and that same file's `CATEGORY_COLORS`) are all removed and replaced by real `Track` data.
- Migration auto-creates a `Track` per distinct existing `category` value and links each course to it — no course is left untracked by the migration.
- The courses-page track filter is multi-select (checkboxes), consistent with the existing `FilterDropdown` pattern it replaces.
- `?track=<slug>` in the courses-page URL pre-populates the filter on load; an unrecognized slug is ignored (shows the unfiltered catalogue), never an error.
- Admin track management uses separate Add/Edit pages (not a modal), mirroring `AddEducationalCenter.jsx`/`EditEducationalCenter.jsx`.

---

## File Structure

**Backend — new files:**
- `server/Models/Track.js` — Track schema (name, slug, description, color).
- `server/Controllers/Track.js` — admin CRUD (list-with-courseCount, create, update, delete-with-block).
- `server/Routers/Track.js` — admin routes, mounted under `protect, requireAdmin`.
- `server/Controllers/Track.test.js` — unit tests for the controller's core logic (slug generation/collision, delete-block).
- `server/Routers/publicTrack.js` — public, unauthenticated `GET /` route.
- `server/scripts/migrateCategoriesToTracks.js` — one-time, manually-run migration script.

**Backend — modified files:**
- `server/Models/course.js` — remove `category`, add `trackId` (ref `Track`, required).
- `server/Controllers/course.js` — `getCourses` populates `trackId`.
- `server/Routers/userAuth.js` — public course list/detail routes populate `trackId`.
- `server/index.js` — mount `trackRouter` (admin) and `publicTrackRouter` (public).

**Frontend — new files:**
- `client/src/admin/api/tracksApi.js` — admin CRUD API wrapper (mirrors `educationalCentersApi.js`).
- `client/src/admin/components/TrackForm.jsx` — shared add/edit form (mirrors `EducationalCenterForm.jsx`).
- `client/src/admin/pages/Tracks.jsx` — list page.
- `client/src/admin/pages/AddTrack.jsx`, `client/src/admin/pages/EditTrack.jsx`.
- `client/src/user/api/tracksApi.js` — public fetch wrapper (mirrors `pageContentApi.js`).

**Frontend — modified files:**
- `client/src/admin/pages/index.js` — export the 3 new Tracks pages.
- `client/src/App.jsx` — register `/tracks`, `/tracks/add`, `/tracks/edit/:id` routes.
- `client/src/admin/pages/AdminDashboard.jsx` — add "Tracks" sidebar link.
- `client/src/admin/components/CourseForm.jsx` — add required Track `<select>`; remove nothing (no category field existed).
- `client/src/admin/pages/Courses.jsx` — replace `getCategoryColor`/derived-`categories`/category filter logic with track-based equivalents.
- `client/src/user/pages/sections/TracksSection.jsx` — fetch live tracks instead of XML/CMS; link to `/courses?track=<slug>`.
- `client/src/user/pages/CoursesPage.jsx` — replace `MEDICAL_SPECIALTIES`/`CATEGORY_COLORS` with fetched tracks; read `?track=` on mount; filter/display by `trackId`.
- `client/src/user/pages/CourseDetail.jsx`, `client/src/user/components/CourseBar.jsx` — display the populated track's name instead of `category`, wherever they currently show `course.category`.

---

### Task 1: `Track` model

**Files:**
- Create: `server/Models/Track.js`

**Interfaces:**
- Produces: `mongoose.model("Track", trackSchema)` with fields `name` (String, required, unique, trim), `slug` (String, required, unique, lowercase, trim), `description` (String, trim, default `""`), `color` (String, trim, default `"#D62828"`), `timestamps: true`.

- [ ] **Step 1: Write the model**

```js
const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Track name is required"],
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    color: {
      type: String,
      trim: true,
      default: "#D62828",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Track", trackSchema);
```

- [ ] **Step 2: Verify it loads without syntax errors**

Run: `cd server && node -e "require('mongoose'); const Track = require('./Models/Track.js'); console.log(Object.keys(Track.schema.paths))"`
Expected: prints an array including `name`, `slug`, `description`, `color`, `createdAt`, `updatedAt`, `_id`, `__v`.

- [ ] **Step 3: Commit**

```bash
git add server/Models/Track.js
git commit -m "feat: add Track model"
```

---

### Task 2: Slug generation utility

**Files:**
- Create: `server/utils/slug.js`
- Test: `server/utils/slug.test.js`

**Interfaces:**
- Produces: `slugify(text: string) -> string` — lowercases, replaces runs of non-alphanumeric characters with a single `-`, trims leading/trailing `-`.
- Consumed by: Task 3's `Track` controller (create/update, for generating and re-generating `slug` from `name`).

- [ ] **Step 1: Write the failing tests**

```js
// server/utils/slug.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test utils/slug.test.js`
Expected: FAIL — `Cannot find module './slug'`.

- [ ] **Step 3: Write minimal implementation**

```js
// server/utils/slug.js
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = { slugify };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test utils/slug.test.js`
Expected: PASS — all 4 tests (5 assertions) green.

- [ ] **Step 5: Commit**

```bash
git add server/utils/slug.js server/utils/slug.test.js
git commit -m "feat: add slugify utility"
```

---

### Task 3: `Track` admin controller and router

**Files:**
- Create: `server/Controllers/Track.js`
- Create: `server/Routers/Track.js`
- Test: `server/Controllers/Track.test.js`

**Interfaces:**
- Consumes: `slugify` from `server/utils/slug.js` (Task 2); `Track` model from `server/Models/Track.js` (Task 1); `Course` model from `server/Models/course.js` (existing).
- Produces: `getTracks`, `createTrack`, `updateTrack`, `deleteTrack` (exported from `server/Controllers/Track.js`); an Express router exported from `server/Routers/Track.js` wiring `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`.
- Also produces (for testability, exported alongside the handlers): `buildUniqueSlug(name, excludeId) -> Promise<string>` — generates a slug via `slugify`, and if it collides with an existing `Track` (other than `excludeId`, used when updating), appends `-2`, `-3`, etc. until unique.

- [ ] **Step 1: Write the failing tests**

```js
// server/Controllers/Track.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test Controllers/Track.test.js`
Expected: FAIL — `Cannot find module './Track'` (relative to `Controllers/`).

- [ ] **Step 3: Write the controller**

```js
// server/Controllers/Track.js
const Track = require("../Models/Track");
const Course = require("../Models/course");
const { slugify } = require("../utils/slug");

async function buildUniqueSlug(name, excludeId) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  for (;;) {
    const query = excludeId
      ? { slug: candidate, _id: { $ne: excludeId } }
      : { slug: candidate };

    const collision = await Track.findOne(query);

    if (!collision) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

const getTracks = async function (req, res) {
  try {
    const [tracks, counts] = await Promise.all([
      Track.find({}).sort({ name: 1 }).lean(),
      Course.aggregate([
        { $group: { _id: "$trackId", count: { $sum: 1 } } },
      ]),
    ]);

    const countsByTrack = new Map(
      counts.map((row) => [String(row._id), row.count])
    );

    const enriched = tracks.map((track) => ({
      ...track,
      courseCount: countsByTrack.get(String(track._id)) || 0,
    }));

    return res.status(200).json(enriched);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get tracks",
      error: error.message,
    });
  }
};

const createTrack = async function (req, res) {
  try {
    const { name, description, color } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Track name is required" });
    }

    const slug = await buildUniqueSlug(name);

    const track = await Track.create({
      name: String(name).trim(),
      slug,
      description: description || "",
      color: color || "#D62828",
    });

    return res.status(201).json(track);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A track with this name already exists",
      });
    }

    return res.status(400).json({
      message: "Failed to create track",
      error: error.message,
    });
  }
};

const updateTrack = async function (req, res) {
  try {
    const { name, description, color } = req.body || {};

    const existing = await Track.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Track not found" });
    }

    const update = {
      description: description ?? existing.description,
      color: color || existing.color,
    };

    if (name && name.trim() && name.trim() !== existing.name) {
      update.name = name.trim();
      update.slug = await buildUniqueSlug(name, existing._id);
    }

    const track = await Track.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(track);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A track with this name already exists",
      });
    }

    return res.status(400).json({
      message: "Failed to update track",
      error: error.message,
    });
  }
};

const deleteTrack = async function (req, res) {
  try {
    const courseCount = await Course.countDocuments({
      trackId: req.params.id,
    });

    if (courseCount > 0) {
      return res.status(409).json({
        message: `Cannot delete a track with ${courseCount} course(s) still assigned to it. Reassign or remove those courses first.`,
      });
    }

    const track = await Track.findByIdAndDelete(req.params.id);

    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    return res.status(200).json({ message: "Track deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete track",
      error: error.message,
    });
  }
};

module.exports = {
  buildUniqueSlug,
  getTracks,
  createTrack,
  updateTrack,
  deleteTrack,
};
```

- [ ] **Step 4: Write the router**

```js
// server/Routers/Track.js
const express = require("express");
const router = express.Router();

const {
  getTracks,
  createTrack,
  updateTrack,
  deleteTrack,
} = require("../Controllers/Track");

router.get("/", getTracks);
router.post("/", createTrack);
router.put("/:id", updateTrack);
router.delete("/:id", deleteTrack);

module.exports = router;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && node --test Controllers/Track.test.js`
Expected: PASS — all 3 tests green.

- [ ] **Step 6: Verify router loads without syntax errors**

Run: `cd server && node -e "require('./Routers/Track.js'); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 7: Commit**

```bash
git add server/Controllers/Track.js server/Controllers/Track.test.js server/Routers/Track.js
git commit -m "feat: add Track admin CRUD controller and router"
```

---

### Task 4: Public tracks route

**Files:**
- Create: `server/Routers/publicTrack.js`

**Interfaces:**
- Consumes: `Track` model.
- Produces: Express router with `GET /` returning `[{ name, slug, description, color }]` for every track (no auth, no `courseCount`).

- [ ] **Step 1: Write the router**

```js
// server/Routers/publicTrack.js
const express = require("express");
const router = express.Router();

const Track = require("../Models/Track");

router.get("/", async (req, res) => {
  try {
    const tracks = await Track.find({})
      .select("name slug description color")
      .sort({ name: 1 });

    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Verify it loads without syntax errors**

Run: `cd server && node -e "require('./Routers/publicTrack.js'); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add server/Routers/publicTrack.js
git commit -m "feat: add public tracks read route"
```

---

### Task 5: Mount the Track routers

**Files:**
- Modify: `server/index.js`

**Interfaces:**
- Consumes: `server/Routers/Track.js` (Task 3), `server/Routers/publicTrack.js` (Task 4).
- Produces: `GET/POST /api/tracks`, `PUT/DELETE /api/tracks/:id` (protected admin), `GET /api/public/tracks` (public), live in the running server.

- [ ] **Step 1: Add the imports**

In `server/index.js`, add near the other router imports (after line 22's `educationalCenterRouter` import):

```js
const trackRouter = require("./Routers/Track");
const publicTrackRouter = require("./Routers/publicTrack");
```

- [ ] **Step 2: Mount the routes**

Add near the other `app.use("/api/...")` mounts (after the `/api/educational-centers` block, before line 132's `/api/courses` mount):

```js
app.use("/api/tracks", protect, requireAdmin, trackRouter);
app.use("/api/public/tracks", publicTrackRouter);
```

- [ ] **Step 3: Verify the server boots**

Run: `cd server && node -e "require('./index.js')" 2>&1 | head -20`
Expected: either connects to MongoDB and logs "Server running on port 4000" (if a `.env`/DB is available in this environment), or fails with a clear `Missing required environment variable` error unrelated to the Track routes (confirming the new code itself has no syntax/import errors). If a `.env`/DB is available, also run a quick live check:

```bash
curl -s http://localhost:4000/api/public/tracks
```
Expected: `[]` (empty array, no tracks created yet).

- [ ] **Step 4: Commit**

```bash
git add server/index.js
git commit -m "feat: mount admin and public track routers"
```

---

### Task 6: `Course` model — replace `category` with `trackId`

**Files:**
- Modify: `server/Models/course.js:79-82`

**Interfaces:**
- Produces: `Course.trackId: ObjectId` (ref `"Track"`, required), replacing the removed `category: String` field.

- [ ] **Step 1: Edit the schema**

Replace lines 79-82:

```js
    category: {
      type: String,
      default: "General",
    },
```

with:

```js
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: true,
    },
```

- [ ] **Step 2: Verify it loads without syntax errors**

Run: `cd server && node -e "require('mongoose'); const Course = require('./Models/course.js'); console.log(Object.keys(Course.schema.paths))"`
Expected: prints an array including `trackId` and NOT including `category`.

- [ ] **Step 3: Commit**

```bash
git add server/Models/course.js
git commit -m "refactor: replace Course.category with required trackId reference"
```

---

### Task 7: Migration script

**Files:**
- Create: `server/scripts/migrateCategoriesToTracks.js`

**Interfaces:**
- Consumes: `Track` model (Task 1), raw MongoDB access to the `courses` collection (via `mongoose.connection.db`, since `Course.category` no longer exists in the Mongoose schema after Task 6 — the script must read the raw stored field, not go through the now-schema-incompatible Mongoose model for the read half).

**Important:** this script must run against data from BEFORE Task 6's schema change reached production (i.e., it reads whatever `category` values are still physically stored in existing documents, using a raw collection query, not the `Course` Mongoose model, since the model no longer declares that field and Mongoose would strip it on read). It writes `trackId` via a raw `updateOne`/`updateMany` on the same raw collection, not via `Course.create`/`save`, to avoid Mongoose validation rejecting documents that don't yet have `trackId` set.

- [ ] **Step 1: Write the script**

```js
// server/scripts/migrateCategoriesToTracks.js
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
```

- [ ] **Step 2: Verify it loads without syntax errors**

Run: `cd server && node -e "require('./scripts/migrateCategoriesToTracks.js')" 2>&1 | head -5`
Expected: either runs against a real DB (if `.env`/`DB` is configured and reachable in this environment) and prints a `Migration complete: {...}` summary, or fails with a connection error unrelated to a syntax problem in the script itself. If a real DB is reachable, actually run it and confirm the printed summary's `coursesMigrated` count matches the number of courses in the database, and spot-check with:

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.DB).then(async () => {
  const Track = require('./Models/Track');
  const tracks = await Track.find({});
  console.log('Tracks:', tracks.map(t => t.name));
  const db = mongoose.connection.db;
  const untracked = await db.collection('courses').countDocuments({ trackId: { \$exists: false } });
  console.log('Courses still without trackId:', untracked);
  await mongoose.disconnect();
});
"
```
Expected: `Courses still without trackId: 0`.

- [ ] **Step 3: Commit**

```bash
git add server/scripts/migrateCategoriesToTracks.js
git commit -m "feat: add one-time category-to-track migration script"
```

---

### Task 8: Admin course endpoints populate `trackId`

**Files:**
- Modify: `server/Controllers/course.js:4-33` (`getCourses`)

**Interfaces:**
- Consumes: `Track` model (via Mongoose `.populate`, no direct import needed — `ref: "Track"` on the schema is sufficient as long as `Track` has been `require`'d somewhere in the process, which it is via `server/Routers/Track.js`; to be safe and explicit, add a direct require).

- [ ] **Step 1: Add the populate**

In `server/Controllers/course.js`, add near the top:

```js
require("../Models/Track");
```

Replace the `Course.find({}).sort({ createdAt: -1 }).lean()` call (line 11) with:

```js
    const [courses, enrollmentCounts] = await Promise.all([
      Course.find({})
        .populate("trackId", "name slug color")
        .sort({ createdAt: -1 })
        .lean(),
      Enrollment.aggregate([
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
      ]),
    ]);
```

(This replaces the existing `Promise.all` block that already does this shape — only the `Course.find(...)` line inside it changes, adding `.populate("trackId", "name slug color")` before `.sort(...)`.)

- [ ] **Step 2: Verify no syntax errors**

Run: `cd server && node -e "require('./Controllers/course.js'); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 3: Manual verification (if a live DB with at least one course+track is available)**

```bash
curl -s -H "Authorization: Bearer <admin-token>" http://localhost:4000/api/courses | head -c 500
```
Expected: each course object's `trackId` field is now an object (`{_id, name, slug, color}`), not a bare ObjectId string.

- [ ] **Step 4: Commit**

```bash
git add server/Controllers/course.js
git commit -m "feat: populate trackId on the admin course list endpoint"
```

---

### Task 9: Public course endpoints populate `trackId`

**Files:**
- Modify: `server/Routers/userAuth.js:1-45` (the `GET /courses` and `GET /courses/:id` routes)

**Interfaces:**
- Consumes: `Track` model (same as Task 8 — add a direct require for explicitness).

- [ ] **Step 1: Add the Track require**

Near the top of `server/Routers/userAuth.js`, add after line 9's `Review` import:

```js
require("../Models/Track");
```

- [ ] **Step 2: Add `.populate` to both course routes**

Replace the `Course.find({ publishStatus: "Published" }).sort({ createdAt: -1 })` line inside `router.get("/courses", ...)` with:

```js
    const courses = await Course.find({ publishStatus: "Published" })
      .populate("trackId", "name slug color")
      .sort({
        createdAt: -1,
      });
```

Replace the `Course.findById(req.params.id)` line inside `router.get("/courses/:id", ...)` with:

```js
    const course = await Course.findById(req.params.id).populate(
      "trackId",
      "name slug color"
    );
```

- [ ] **Step 3: Verify no syntax errors**

Run: `cd server && node -e "require('./Routers/userAuth.js'); console.log('OK')"`
Expected: prints `OK`.

- [ ] **Step 4: Manual verification (if a live DB is available)**

```bash
curl -s http://localhost:4000/api/user/courses | head -c 500
```
Expected: each course's `trackId` field is a populated object with `name`/`slug`/`color`, alongside the existing `displayPrice`/`currency` fields from the currency feature.

- [ ] **Step 5: Commit**

```bash
git add server/Routers/userAuth.js
git commit -m "feat: populate trackId on the public course list/detail endpoints"
```

---

### Task 10: Admin tracks API client

**Files:**
- Create: `client/src/admin/api/tracksApi.js`

**Interfaces:**
- Consumes: `adminFetch` from `client/src/admin/api/apiClient.js` (existing).
- Produces: `getTracks()`, `createTrack(data)`, `updateTrack(id, data)`, `deleteTrack(id)`.

- [ ] **Step 1: Write the file**

```js
// client/src/admin/api/tracksApi.js
import { adminFetch } from "./apiClient";

export async function getTracks() {
  return adminFetch("/tracks");
}

export async function createTrack(trackData) {
  return adminFetch("/tracks", {
    method: "POST",
    body: JSON.stringify(trackData),
  });
}

export async function updateTrack(id, trackData) {
  return adminFetch(`/tracks/${id}`, {
    method: "PUT",
    body: JSON.stringify(trackData),
  });
}

export async function deleteTrack(id) {
  return adminFetch(`/tracks/${id}`, {
    method: "DELETE",
  });
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd client && node -e "require('@babel/core')" 2>/dev/null; npx vite build --mode development 2>&1 | tail -20` — actually, simplest check: this file has no runtime side effects on import, so a full build in a later task will catch any syntax error. Skip a standalone check here.

- [ ] **Step 3: Commit**

```bash
git add client/src/admin/api/tracksApi.js
git commit -m "feat: add admin tracks API client"
```

---

### Task 11: `TrackForm` shared component

**Files:**
- Create: `client/src/admin/components/TrackForm.jsx`

**Interfaces:**
- Produces: default export `TrackForm({ mode, formData, setFormData, onSubmit, loading })`; named export `emptyTrack = { name: "", description: "", color: "#D62828" }`.

- [ ] **Step 1: Write the component**

```jsx
// client/src/admin/components/TrackForm.jsx
import { Link } from "react-router-dom";

export const emptyTrack = {
  name: "",
  description: "",
  color: "#D62828",
};

export default function TrackForm({
  mode = "add",
  formData,
  setFormData,
  onSubmit,
  loading,
}) {
  const isAddMode = mode === "add";

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold heading-font">
            {isAddMode ? "Add New Track" : "Edit Track"}
          </h1>

          <p className="muted-text mt-2 max-w-2xl">
            {isAddMode
              ? "Create a new course track for the home page and course catalogue."
              : "Update this track's name, description, and color."}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/tracks"
            className="px-5 py-3 bg-white text-charcoal border border-gray-200 rounded-xl font-bold heading-font hover:bg-softGrey transition"
          >
            Back
          </Link>

          <button
            type="submit"
            form="trackForm"
            disabled={loading}
            className="px-5 py-3 bg-brandRed text-white rounded-xl font-bold heading-font hover:opacity-90 transition disabled:opacity-60"
          >
            {loading
              ? isAddMode
                ? "Saving..."
                : "Updating..."
              : isAddMode
              ? "Save Track"
              : "Update Track"}
          </button>
        </div>
      </div>

      <form id="trackForm" onSubmit={onSubmit} className="space-y-8">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
          <h2 className="text-2xl heading-font font-bold mb-6">
            Track Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Track Name
              </label>

              <input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                required
                className="w-full h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Color
              </label>

              <div className="flex items-center gap-3">
                <input
                  name="color"
                  type="color"
                  value={formData.color || "#D62828"}
                  onChange={handleChange}
                  className="h-12 w-16 rounded-xl border border-gray-200 cursor-pointer"
                />

                <input
                  name="color"
                  value={formData.color || "#D62828"}
                  onChange={handleChange}
                  className="flex-1 h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-gray-200 bg-softGrey px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/admin/components/TrackForm.jsx
git commit -m "feat: add shared TrackForm component"
```

---

### Task 12: Admin Add/Edit Track pages

**Files:**
- Create: `client/src/admin/pages/AddTrack.jsx`
- Create: `client/src/admin/pages/EditTrack.jsx`

**Interfaces:**
- Consumes: `TrackForm`, `emptyTrack` (Task 11); `createTrack`, `updateTrack`, `getTracks` (Task 10 — note: there's no `getTrackById` endpoint; `EditTrack` fetches the full list and finds the one it needs, since tracks are few and the list is cheap — avoids adding a `GET /tracks/:id` route not otherwise needed).

- [ ] **Step 1: Write `AddTrack.jsx`**

```jsx
// client/src/admin/pages/AddTrack.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TrackForm, { emptyTrack } from "../components/TrackForm";
import { createTrack } from "../api/tracksApi";

export default function AddTrack() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyTrack);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await createTrack(formData);

      navigate("/tracks");
    } catch (error) {
      alert(error.message);
      console.error("Create track error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TrackForm
      mode="add"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}
```

- [ ] **Step 2: Write `EditTrack.jsx`**

```jsx
// client/src/admin/pages/EditTrack.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TrackForm, { emptyTrack } from "../components/TrackForm";
import { getTracks, updateTrack } from "../api/tracksApi";

export default function EditTrack() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyTrack);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(
    function () {
      async function loadTrack() {
        try {
          const tracks = await getTracks();
          const track = tracks.find((t) => t._id === id);

          if (!track) {
            throw new Error("Track not found");
          }

          setFormData({
            name: track.name,
            description: track.description || "",
            color: track.color || "#D62828",
          });
        } catch (error) {
          alert(error.message);
          console.error("Load track error:", error.message);
        } finally {
          setPageLoading(false);
        }
      }

      loadTrack();
    },
    [id]
  );

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await updateTrack(id, formData);

      navigate("/tracks");
    } catch (error) {
      alert(error.message);
      console.error("Update track error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-softGrey flex items-center justify-center">
        <p className="font-bold text-charcoal">Loading track...</p>
      </div>
    );
  }

  return (
    <TrackForm
      mode="edit"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/admin/pages/AddTrack.jsx client/src/admin/pages/EditTrack.jsx
git commit -m "feat: add admin Add/Edit Track pages"
```

---

### Task 13: Admin Tracks list page

**Files:**
- Create: `client/src/admin/pages/Tracks.jsx`

**Interfaces:**
- Consumes: `getTracks`, `deleteTrack` (Task 10).

- [ ] **Step 1: Write the page**

```jsx
// client/src/admin/pages/Tracks.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTrack, getTracks } from "../api/tracksApi";

export default function Tracks() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const data = await getTracks();

      setTracks(data);
    } catch (error) {
      alert(error.message);
      console.error("Load tracks error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadData();
  }, []);

  async function handleDelete(track) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${track.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteTrack(track._id);
      await loadData();
    } catch (error) {
      alert(error.message);
      console.error("Delete track error:", error.message);
    }
  }

  const filteredTracks = tracks.filter((track) =>
    track.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold heading-font">Tracks</h1>

            <p className="muted-text mt-2 max-w-2xl">
              Manage the course tracks shown on the home page and used to
              categorize every course.
            </p>
          </div>

          <Link
            to="/tracks/add"
            className="px-5 py-3 bg-brandRed text-white rounded-xl font-bold heading-font flex items-center gap-2 hover:opacity-90 transition"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Track
          </Link>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-charcoal placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-card">
            <p className="font-bold text-charcoal">Loading tracks...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-card p-12 text-center">
            <p className="heading-font text-2xl font-bold text-charcoal mb-2">
              No tracks found
            </p>
            <p className="text-sm muted-text">
              {tracks.length === 0
                ? "Add your first track to get started."
                : "Change the search and try again."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map((track) => (
              <div
                key={track._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ background: track.color }}
                  />
                  <h3 className="text-lg heading-font font-bold text-charcoal">
                    {track.name}
                  </h3>
                </div>

                {track.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {track.description}
                  </p>
                )}

                <p className="text-xs text-gray-400 mb-4">
                  {track.courseCount}{" "}
                  {track.courseCount === 1 ? "course" : "courses"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Link
                    to={`/tracks/edit/${track._id}`}
                    className="w-9 h-9 rounded-lg bg-softGrey flex items-center justify-center text-charcoal hover:bg-brandRed hover:text-white transition"
                  >
                    <span className="material-symbols-outlined text-lg">
                      edit
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(track)}
                    className="w-9 h-9 rounded-lg bg-softGrey flex items-center justify-center text-brandRed hover:bg-brandRed hover:text-white transition"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/admin/pages/Tracks.jsx
git commit -m "feat: add admin Tracks list page"
```

---

### Task 14: Wire Tracks pages into routing, exports, and nav

**Files:**
- Modify: `client/src/admin/pages/index.js`
- Modify: `client/src/App.jsx`
- Modify: `client/src/admin/pages/AdminDashboard.jsx`

**Interfaces:**
- Consumes: `Tracks`, `AddTrack`, `EditTrack` (Tasks 12, 13).

- [ ] **Step 1: Add exports**

In `client/src/admin/pages/index.js`, add near the `EducationalCenter*` exports:

```js
export { default as Tracks } from "./Tracks";
export { default as AddTrack } from "./AddTrack";
export { default as EditTrack } from "./EditTrack";
```

- [ ] **Step 2: Add routes**

In `client/src/App.jsx`, add `Tracks, AddTrack, EditTrack,` to the import block from `"./admin/pages"` (alongside `EducationalCenters,` etc. around line 22-25), then add route entries after the `/educational-centers/:id` route block (after line 339):

```jsx
        <Route
          path="/tracks"
          element={
            <PrivatePage>
              <Tracks />
            </PrivatePage>
          }
        />
        <Route
          path="/tracks/add"
          element={
            <PrivatePage>
              <AddTrack />
            </PrivatePage>
          }
        />
        <Route
          path="/tracks/edit/:id"
          element={
            <PrivatePage>
              <EditTrack />
            </PrivatePage>
          }
        />
```

- [ ] **Step 3: Add sidebar link**

In `client/src/admin/pages/AdminDashboard.jsx`, add a `SidebarLink` after the existing `Courses` link (after line 144):

```jsx
          <SidebarLink to="/tracks" icon="route" text="Tracks" />
```

- [ ] **Step 4: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors (module count may differ slightly from prior runs due to the 3 new page files).

- [ ] **Step 5: Commit**

```bash
git add client/src/admin/pages/index.js client/src/App.jsx client/src/admin/pages/AdminDashboard.jsx
git commit -m "feat: wire Tracks pages into admin routing, exports, and sidebar nav"
```

---

### Task 15: `CourseForm.jsx` — required Track select

**Files:**
- Modify: `client/src/admin/components/CourseForm.jsx`

**Interfaces:**
- Consumes: `getTracks` from `client/src/admin/api/tracksApi.js` (Task 10).
- Produces: `formData.trackId` is now part of the form's submitted payload.

- [ ] **Step 1: Add state and fetch for the tracks list**

Add the import near the top of `client/src/admin/components/CourseForm.jsx` (after line 3's `RichTextEditor` import):

```js
import { useEffect, useState } from "react";
import { getTracks } from "../api/tracksApi";
```

(Note: `useState` is already imported on line 1 — merge into the existing import statement rather than duplicating it: change line 1 from `import { useState } from "react";` to `import { useEffect, useState } from "react";`.)

Add `trackId: ""` to the `emptyCourse` object (after line 6's `courseName: "",`):

```js
  trackId: "",
```

Inside the `CourseForm` component function (after the existing `const [editingLesson, setEditingLesson] = useState(null);` on line 42), add:

```js
  const [tracks, setTracks] = useState([]);

  useEffect(function () {
    getTracks()
      .then(setTracks)
      .catch((error) => console.error("Load tracks error:", error.message));
  }, []);
```

- [ ] **Step 2: Add the Track select to the Pricing & Visibility section**

In the same file, insert a new field immediately before the existing "Course Price (EGP)" block (before the `<div className="space-y-2">` that starts at line 892):

```jsx
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#333333] px-1">
                    Track
                  </label>

                  <select
                    name="trackId"
                    value={formData.trackId || ""}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828] transition-all outline-none font-bold"
                  >
                    <option value="" disabled>
                      Select a track
                    </option>
                    {tracks.map((track) => (
                      <option key={track._id} value={track._id}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                </div>
```

- [ ] **Step 3: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 4: Manual verification (if a live server + at least one track exists)**

Run both dev servers, open the admin Add Course form, confirm a "Track" dropdown appears above "Course Price (EGP)" listing the tracks created via the admin Tracks page, and that submitting without selecting one is blocked by the browser's native required-field validation.

- [ ] **Step 5: Commit**

```bash
git add client/src/admin/components/CourseForm.jsx
git commit -m "feat: add required Track selector to the admin course form"
```

---

### Task 16: `admin/pages/Courses.jsx` — track-based filtering and badges

**Files:**
- Modify: `client/src/admin/pages/Courses.jsx`

**Interfaces:**
- Consumes: populated `course.trackId` (`{_id, name, slug, color}`) from Task 8's backend change.

- [ ] **Step 1: Remove the old category color map and derived-categories logic**

Delete the `getCategoryColor` function (lines 36-46):

```js
function getCategoryColor(category) {
  const colors = {
    "Basic POCUS": "bg-[#1E2A61]",
    "Two Days": "bg-[#B98D36]",
    Advanced: "bg-[#885FB0]",
    Archived: "bg-[#551212]",
    General: "bg-[#046E67]",
  };

  return colors[category] || "bg-[#046E67]";
}
```

Replace the `categories` `useMemo` (lines 146-152):

```js
  const categories = useMemo(
    function () {
      const values = courses.map((course) => course.category || "General");
      return [...new Set(values)];
    },
    [courses]
  );
```

with a track-based equivalent that derives from the populated `trackId` objects instead of a free-text field:

```js
  const trackOptions = useMemo(
    function () {
      const seen = new Map();
      courses.forEach((course) => {
        if (course.trackId?._id) {
          seen.set(course.trackId._id, course.trackId);
        }
      });
      return [...seen.values()];
    },
    [courses]
  );
```

- [ ] **Step 2: Update the filter state and matching logic**

Change `const [categoryFilter, setCategoryFilter] = useState("");` (line 57) to:

```js
  const [trackFilter, setTrackFilter] = useState("");
```

Update the `resetFilters` function's `setCategoryFilter("");` (line 140) to `setTrackFilter("");`.

In the `filteredCourses` `useMemo`, replace:

```js
        const courseCategory = (course.category || "General").toLowerCase();
```

with:

```js
        const courseTrackId = course.trackId?._id || "";
```

and replace:

```js
        const matchCategory =
          !categoryFilter || courseCategory === categoryFilter.toLowerCase();
```

with:

```js
        const matchTrack = !trackFilter || courseTrackId === trackFilter;
```

Update the `searchableText` array (which included `course.category`) to use the track's name instead:

```js
        const searchableText = [
          course.courseName,
          course.courseDescription,
          course.trackId?.name,
          course.instructor,
          course.publishStatus,
          course.coursePrice,
        ]
          .join(" ")
          .toLowerCase();
```

Update the final `return` of the filter predicate to use `matchTrack` instead of `matchCategory` (find the line combining `matchTab && matchCategory && matchInstructor && matchStatus`-style conditions and rename `matchCategory` to `matchTrack` there too).

- [ ] **Step 3: Update the filter dropdown**

Replace the category `<select>` (lines 415-426):

```jsx
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 rounded-xl border border-[#e5e5e5] bg-[#F2F2F2] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
```

with:

```jsx
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="h-12 rounded-xl border border-[#e5e5e5] bg-[#F2F2F2] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              >
                <option value="">All Tracks</option>
                {trackOptions.map((track) => (
                  <option key={track._id} value={track._id}>
                    {track.name}
                  </option>
                ))}
              </select>
```

- [ ] **Step 4: Update the course card badge**

Replace `const category = course.category || "General";` (line 632) with:

```js
  const trackName = course.trackId?.name || "Uncategorized";
  const trackColor = course.trackId?.color || "#046E67";
```

Replace the badge JSX (lines 656-664):

```jsx
        <div className="absolute top-4 left-4">
          <span
            className={`${getCategoryColor(
              category
            )} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider`}
          >
            {category}
          </span>
        </div>
```

with:

```jsx
        <div className="absolute top-4 left-4">
          <span
            className="text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: trackColor }}
          >
            {trackName}
          </span>
        </div>
```

- [ ] **Step 5: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors. Also grep to confirm no leftover references:

```bash
grep -n "categoryFilter\|getCategoryColor\|course.category" client/src/admin/pages/Courses.jsx
```
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add client/src/admin/pages/Courses.jsx
git commit -m "feat: replace category filtering/badges with track-based equivalents in admin course list"
```

---

### Task 17: Public tracks API client

**Files:**
- Create: `client/src/user/api/tracksApi.js`

**Interfaces:**
- Produces: `getPublicTracks() -> Promise<Array<{name, slug, description, color}>>`.

- [ ] **Step 1: Write the file**

```js
// client/src/user/api/tracksApi.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function getPublicTracks() {
  const res = await fetch(`${API_URL}/public/tracks`);

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Failed to load tracks");
  }

  return data;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/user/api/tracksApi.js
git commit -m "feat: add public tracks API client"
```

---

### Task 18: `TracksSection.jsx` — live tracks on the home page

**Files:**
- Modify: `client/src/user/pages/sections/TracksSection.jsx`

**Interfaces:**
- Consumes: `getPublicTracks` (Task 17).

- [ ] **Step 1: Replace the data source**

Replace the entire file:

```jsx
// client/src/user/pages/sections/TracksSection.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicTracks } from "../../api/tracksApi";

export default function TracksSection() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);

  useEffect(function () {
    getPublicTracks()
      .then(setTracks)
      .catch((error) => console.error("Load tracks error:", error.message));
  }, []);

  return (
    <section id="tracks" className="bg-softGrey py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-8 gap-6">
          <div>
            <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-2">
              What we offer
            </p>

            <h2
              className="font-heading font-black text-charcoal"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
            >
              We deliver {tracks.length} specialised track
              {tracks.length === 1 ? "" : "s"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="hidden sm:flex items-center gap-2 border border-gray-300 bg-white rounded-xl px-5 py-2.5 text-sm font-semibold text-charcoal hover:border-brandRed hover:text-brandRed transition"
          >
            View all courses

            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <div
              key={track.slug}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
              onClick={() => navigate(`/courses?track=${track.slug}`)}
            >
              <div
                className="w-8 h-8 rounded-lg mb-4 flex items-center justify-center"
                style={{ background: `${track.color}18` }}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ background: track.color }}
                />
              </div>

              <p className="font-heading font-bold text-charcoal text-sm mb-1">
                {track.name}
              </p>

              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                {track.description}
              </p>

              <p className="text-xs font-semibold text-charcoal group-hover:text-brandRed transition flex items-center gap-1">
                Explore track

                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/user/pages/sections/TracksSection.jsx
git commit -m "feat: render live tracks on the home page instead of static XML/CMS data"
```

---

### Task 19: `CoursesPage.jsx` — track-based filter, badges, and `?track=` deep link

**Files:**
- Modify: `client/src/user/pages/CoursesPage.jsx`

**Interfaces:**
- Consumes: `getPublicTracks` (Task 17); populated `course.trackId` from Task 9's backend change.

- [ ] **Step 1: Remove the hardcoded category lists, add tracks fetch**

Replace the imports at the top of the file:

```js
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublishedCourses, getMyCourseIds, getUserToken } from "../api/userApi";
import { getPublicTracks } from "../api/tracksApi";
import UserNavbar from "../components/UserNavbar";
import usePageTitle from "../hooks/usePageTitle";
import { listInstructors, formatInstructorList, stripHtmlToText } from "../components/CourseBar";
import { formatPrice } from "../../utils/currency";
```

Delete the `MEDICAL_SPECIALTIES` array (lines 18-36), the `CATEGORY_COLORS` object and `getCategoryGradient` function (lines 38-56) — these are replaced by per-track colors coming from the populated `trackId` object directly, so no gradient-guessing logic is needed anymore.

- [ ] **Step 2: Update `CourseCard` to use the populated track**

Replace:

```js
function CourseCard({ course, enrolled }) {
  const { from, to } = getCategoryGradient(course.category);
```

with:

```js
function CourseCard({ course, enrolled }) {
  const trackColor = course.trackId?.color || "#374151";
```

Replace the banner's gradient `style` (which used `from`/`to`):

```jsx
        style={
          course.previewImage
            ? undefined
            : { background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }
        }
```

with:

```jsx
        style={
          course.previewImage
            ? undefined
            : { background: trackColor }
        }
```

Replace the track/category label in the banner:

```jsx
          {course.category && (
            <span className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-1 block">
              {course.category}
            </span>
          )}
```

with:

```jsx
          {course.trackId?.name && (
            <span className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-1 block">
              {course.trackId.name}
            </span>
          )}
```

- [ ] **Step 3: Add tracks state, fetch, and URL-param handling in the page component**

In the `CoursesPage` function, replace:

```js
  const [activeCategories, setActiveCategories] = useState(new Set());
```

with:

```js
  const [tracks, setTracks] = useState([]);
  const [activeTracks, setActiveTracks] = useState(new Set());
```

Replace the course-fetching `useEffect` to also fetch tracks and seed `activeTracks` from the URL:

```js
  useEffect(() => {
    const enrolledPromise = getUserToken()
      ? getMyCourseIds().catch(() => [])
      : Promise.resolve([]);

    Promise.all([
      getPublishedCourses().catch((err) => { setError(err.message); return []; }),
      enrolledPromise,
      getPublicTracks().catch(() => []),
    ])
      .then(([list, ids, trackList]) => {
        setCourses(Array.isArray(list) ? list : []);
        setEnrolledIds(new Set(Array.isArray(ids) ? ids : []));
        setTracks(Array.isArray(trackList) ? trackList : []);

        const params = new URLSearchParams(window.location.search);
        const requestedSlug = params.get("track");
        const matched = Array.isArray(trackList)
          ? trackList.find((t) => t.slug === requestedSlug)
          : null;

        if (matched) {
          setActiveTracks(new Set([matched._id]));
        }
      })
      .finally(() => setLoading(false));
  }, []);
```

Delete the line `const categories = MEDICAL_SPECIALTIES;`.

- [ ] **Step 4: Update `toggleCategory`/`clearAll`/`activeFiltersCount`/filter logic**

Rename `toggleCategory` to `toggleTrack`, operating on `activeTracks`:

```js
  function toggleTrack(trackId) {
    setActiveTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }
```

Update `clearAll`:

```js
  function clearAll() {
    setActiveTracks(new Set());
    setPriceFilter("all");
    setEnrollFilter("all");
  }
```

Update `activeFiltersCount`:

```js
  const activeFiltersCount =
    activeTracks.size +
    (priceFilter !== "all" ? 1 : 0) +
    (enrollFilter !== "all" ? 1 : 0);
```

Update the `filtered` computation's search/category matching:

```js
  const filtered = courses
    .filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.courseName?.toLowerCase().includes(q) ||
        c.trackId?.name?.toLowerCase().includes(q) ||
        c.courseDescription?.toLowerCase().includes(q);
      const matchesTrack = activeTracks.size === 0 ||
        (c.trackId?._id && activeTracks.has(c.trackId._id));
      const price = Number(c.coursePrice) || 0;
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && price === 0) ||
        (priceFilter === "paid" && price > 0);
      const enrolled = enrolledIds.has(String(c._id));
      const matchesEnroll =
        enrollFilter === "all" ||
        (enrollFilter === "enrolled" && enrolled) ||
        (enrollFilter === "new" && !enrolled);
      return matchesSearch && matchesTrack && matchesPrice && matchesEnroll;
    })
```

(The `.sort(...)` block that follows is unchanged.)

- [ ] **Step 5: Update the filter dropdown UI**

Replace the "Category" `FilterDropdown` block:

```jsx
                {(
                  <FilterDropdown label="Category" activeCount={activeCategories.size}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Category</p>
                    <div className="space-y-2">
                      {categories.map((cat) => {
                        const count = courses.filter((c) => c.category?.toLowerCase() === cat.toLowerCase()).length;
                        const active = activeCategories.has(cat);
                        return (
                          <button key={cat} type="button" onClick={() => toggleCategory(cat)} className="flex items-center gap-2.5 w-full group">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition flex-shrink-0
                              ${active ? "bg-brandRed border-brandRed" : "border-gray-300 group-hover:border-brandRed"}`}>
                              {active && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm flex-1 text-left transition ${active ? "text-charcoal font-semibold" : "text-gray-500 group-hover:text-charcoal"}`}>{cat}</span>
                            <span className="text-[11px] text-gray-300 tabular-nums">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FilterDropdown>
                )}
```

with:

```jsx
                {tracks.length > 0 && (
                  <FilterDropdown label="Track" activeCount={activeTracks.size}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Track</p>
                    <div className="space-y-2">
                      {tracks.map((track) => {
                        const count = courses.filter((c) => c.trackId?._id === track._id).length;
                        const active = activeTracks.has(track._id);
                        return (
                          <button key={track._id} type="button" onClick={() => toggleTrack(track._id)} className="flex items-center gap-2.5 w-full group">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition flex-shrink-0
                              ${active ? "bg-brandRed border-brandRed" : "border-gray-300 group-hover:border-brandRed"}`}>
                              {active && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm flex-1 text-left transition ${active ? "text-charcoal font-semibold" : "text-gray-500 group-hover:text-charcoal"}`}>{track.name}</span>
                            <span className="text-[11px] text-gray-300 tabular-nums">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FilterDropdown>
                )}
```

- [ ] **Step 6: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors. Also grep to confirm no leftover references:

```bash
grep -n "MEDICAL_SPECIALTIES\|CATEGORY_COLORS\|getCategoryGradient\|activeCategories\|toggleCategory\|course.category" client/src/user/pages/CoursesPage.jsx
```
Expected: no matches.

- [ ] **Step 7: Manual verification (if a live server with tracks/courses is available)**

1. Visit `/courses` with no query param — confirm the "Track" filter dropdown lists real tracks (not the old medical-specialty list), each with a course count.
2. From the home page, click a track card — confirm it navigates to `/courses?track=<slug>` and that track is pre-checked in the filter, showing only that track's courses.
3. Visit `/courses?track=nonexistent-slug` — confirm it shows the unfiltered full catalogue rather than erroring.

- [ ] **Step 8: Commit**

```bash
git add client/src/user/pages/CoursesPage.jsx
git commit -m "feat: replace hardcoded category filter with track-based filter and URL deep-linking"
```

---

### Task 20: `CourseDetail.jsx` and `CourseBar.jsx` — display track name

**Files:**
- Modify: `client/src/user/pages/CourseDetail.jsx`
- Modify: `client/src/user/components/CourseBar.jsx`

**Interfaces:**
- Consumes: populated `course.trackId.name` from Task 9's backend change.

- [ ] **Step 1: Find and update remaining `course.category` display references**

Run this to find every remaining reference before editing:

```bash
grep -rn "course\.category\|\.category\b" client/src/user/pages/CourseDetail.jsx client/src/user/components/CourseBar.jsx
```

For each match found, replace the display expression from `course.category` to `course.trackId?.name`. (The exact surrounding JSX/line numbers depend on what the grep above reveals — apply the same category-to-track-name substitution pattern used in Tasks 16/19 at each site: wherever the old code rendered `{course.category}` or checked `course.category &&`, render `{course.trackId?.name}` / check `course.trackId?.name &&` instead.)

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Grep for any remaining `.category` references across the whole client**

```bash
grep -rn "\.category\b" client/src --include="*.jsx" --include="*.js"
```
Expected: no matches remain anywhere in `client/src` (all category display has been migrated to track display).

- [ ] **Step 4: Commit**

```bash
git add client/src/user/pages/CourseDetail.jsx client/src/user/components/CourseBar.jsx
git commit -m "feat: display track name instead of category on course detail views"
```

---

### Task 21: Full regression pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend test suite**

Run: `cd server && node --test`
Expected: PASS — all suites green, including the new `utils/slug.test.js` and `Controllers/Track.test.js` from Tasks 2 and 3, plus every pre-existing test.

- [ ] **Step 2: Run the full client build**

Run: `cd client && npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Full grep sweep for leftover category references**

```bash
grep -rn "\.category\b\|MEDICAL_SPECIALTIES\|getCategoryColor\|CATEGORY_COLORS" server client/src --include="*.js" --include="*.jsx"
```
Expected: no matches anywhere in the codebase.

- [ ] **Step 4: Manual walkthrough (if a live server + DB is available)**

1. Run the migration script (Task 7) against a copy of real data, or seed fresh: create 2-3 tracks via the admin Tracks page.
2. Admin: create a course via Add Course — confirm the Track dropdown is required and populated.
3. Admin: confirm deleting a track with courses assigned is blocked with a clear message; confirm deleting an empty track succeeds.
4. Public: home page's "What we offer" section shows the real tracks with correct names/colors/descriptions.
5. Public: click a track card, confirm it lands on `/courses?track=<slug>` with that track pre-filtered.
6. Public: on the courses page, toggle additional tracks in the filter, confirm multi-select works and course counts are accurate.
7. Public: a course's detail page shows its track name where the old category badge used to be.

- [ ] **Step 5: Report status**

If all checks pass, this feature is complete. If any manual check fails, return to the relevant task above and fix before considering the plan done.
