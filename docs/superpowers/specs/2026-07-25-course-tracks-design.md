# Course Tracks

## Problem

Every course should belong to a "track" (e.g. "Basic POCUS", "Advanced POCUS")
that admins can add and remove. The home page's "What we offer" section
should display these tracks, and clicking one should open the courses page
pre-filtered to that track.

Today there is no real track/category system:

- `Course.category` (`server/Models/course.js:79-82`) is unconstrained free
  text with no admin UI to set it (`CourseForm.jsx` has no category input at
  all — courses only get a category value via direct DB edits or seed
  scripts).
- Three mutually inconsistent hardcoded category vocabularies exist:
  `admin/pages/Courses.jsx`'s badge-color map, `user/pages/CoursesPage.jsx`'s
  `MEDICAL_SPECIALTIES` filter list, and that same file's separate
  `CATEGORY_COLORS` gradient map (matched by substring, not by the
  specialties list).
- The home page's "What we offer" section (`TracksSection.jsx`) already
  displays "tracks", but they come from a static XML file
  (`client/public/data/landing-data.xml`) or a generic CMS blob
  (`PageContent`), with no connection to real courses. Clicking a track card
  always navigates to the generic `/courses` URL with no filtering.
- `CoursesPage.jsx` fetches the entire course catalogue in one unfiltered
  request and filters client-side; there is no URL query-param support for
  deep-linking into a filtered view.

## Goals

- A new `Track` collection is the single source of truth for course
  categorization, replacing the free-text `category` field.
- Every course has exactly one track (required field).
- Admins can create, edit, and delete tracks from the admin dashboard.
- Deleting a track that still has courses assigned to it is blocked with a
  clear error.
- The home page's "What we offer" section renders live from the `Track`
  collection (replacing the static XML/CMS source entirely).
- Clicking a track card on the home page opens `/courses` pre-filtered to
  that track.
- The courses page's track filter is multi-select, consistent with its
  existing filter UI conventions.
- Existing courses are migrated automatically: a `Track` is created for each
  distinct `category` value currently in use, and each course is linked to
  the corresponding track.

## Non-goals

- Server-side paginated/filtered course search (the courses page continues
  its existing client-side-filter-after-fetch-all approach; only the data
  source for the filter options changes).
- Track hierarchies/sub-tracks — flat list only.
- Image upload per track — color + text only, matching what the home page
  cards already show today.
- Editing the generic `PageContent`/CMS "tracks" section — it is fully
  superseded for this section, not extended.

## Data model

### New: `Track` (`server/Models/Track.js`)

```js
{
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true, default: "" },
  color: { type: String, trim: true, default: "#D62828" },
  timestamps: true,
}
```

- `slug` is derived from `name` at creation/update time (lowercase,
  spaces/punctuation replaced with `-`), and used in the `?track=` URL query
  param instead of a raw Mongo ObjectId, so links remain stable and readable
  even as `_id` values are opaque. If a generated slug collides with an
  existing one, a numeric suffix is appended (`basic-pocus-2`).
- No `courseCount` field is stored on the document — course counts are
  computed on read via a `Course.countDocuments({ trackId })` aggregation
  when the admin list needs them, avoiding a denormalized counter that could
  drift out of sync.

### Changed: `Course` (`server/Models/course.js`)

- `category: { type: String, default: "General" }` is removed.
- New field: `trackId: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true }`.

## Migration

One-time script, `server/scripts/migrateCategoriesToTracks.js`, run manually
(not wired into app startup, matching the existing `seedAdmin.js`
convention):

1. Find all distinct `category` values across existing `Course` documents
   (treating a missing/empty category as `"General"`, matching the schema's
   old default).
2. For each distinct value, create a `Track` with that value as `name`
   (skip if a `Track` with that name already exists, so the script is safe
   to re-run).
3. For each `Course`, set `trackId` to the `Track` whose name matches its
   old `category` value.
4. Log a summary (tracks created, courses migrated, any courses that
   couldn't be matched — should not happen given step 1's exhaustiveness,
   but logged defensively).

The script does not drop the old `category` field from existing documents
automatically (Mongoose simply stops reading/writing it once the schema
changes) — a follow-up manual `$unset` cleanup is optional and not required
for correctness, consistent with how the prior currency-feature branch
handled a similar stray-field situation.

## Backend

### Admin routes (`server/Routers/Track.js`, mounted with `protect, requireAdmin`)

- `GET /api/tracks` — list all tracks, each annotated with a live
  `courseCount` (via aggregation, not stored).
- `POST /api/tracks` — create. Validates `name` is non-empty and unique;
  generates `slug`.
- `PUT /api/tracks/:id` — update `name`/`description`/`color`. If `name`
  changes, `slug` is regenerated (with collision handling as above).
- `DELETE /api/tracks/:id` — if `Course.countDocuments({ trackId: id }) > 0`,
  respond `409` with a message like "Cannot delete a track with N course(s)
  still assigned to it. Reassign or remove those courses first." Otherwise
  delete.

Controller (`server/Controllers/Track.js`) and router mirror the existing
`EducationalCenter.js` controller/router pair's structure and error-handling
conventions.

### Public route

- `GET /api/public/tracks` — no auth, returns `name`, `slug`, `description`,
  `color` for every track (no `courseCount` needed publicly). Feeds both the
  home page `TracksSection` and the `CoursesPage` filter dropdown.

### Course controller changes

- `server/Controllers/course.js`'s create/update handlers (admin course
  CRUD, protected): `trackId` becomes a required field in request
  validation (matching how `courseName`/`coursePrice` are already validated
  as required).
- The public, unauthenticated course list/detail routes — `GET /courses`
  and `GET /courses/:id` in `server/Routers/userAuth.js` — must add
  `.populate("trackId", "name slug color")` to their existing `Course.find`/
  `Course.findById` calls. This is a required backend change, not just a
  frontend consumption detail: without it, `course.trackId` in the API
  response is a bare ObjectId string and the public course cards/filter
  have no track name or color to render. The admin course list endpoint
  (`server/Controllers/course.js`'s `getCourses`) needs the same
  `.populate` treatment for `admin/pages/Courses.jsx`'s track-based badge
  color and filter.

## Frontend

### Admin

- `client/src/admin/pages/Tracks.jsx` — list page: table/cards showing
  color swatch, name, description, live course count, edit/delete actions.
  Search-by-name, mirroring `EducationalCenters.jsx`'s list/search pattern.
  Delete action calls the DELETE endpoint and surfaces the 409 "still has
  courses assigned" message via the existing alert/toast pattern used
  elsewhere in the admin.
- `client/src/admin/pages/AddTrack.jsx`, `EditTrack.jsx` — dedicated pages
  (name, description, color-picker input), mirroring
  `AddEducationalCenter.jsx`/`EditEducationalCenter.jsx`'s form/validation/
  submit structure.
- New routes registered in `client/src/App.jsx`: `/tracks`, `/tracks/add`,
  `/tracks/edit/:id`, alongside the existing `/educational-centers` block.
- New sidebar nav entry for "Tracks" in the admin layout.
- `client/src/admin/components/CourseForm.jsx` — new required "Track"
  `<select>` populated from `GET /api/public/tracks`, replacing nothing
  (no category input existed before), placed in the same "Pricing &
  Visibility" section or a new "Classification" section near the top of the
  form.
- `client/src/admin/pages/Courses.jsx` — the `getCategoryColor()` hardcoded
  map and the "derive filter options from loaded courses" logic are both
  replaced: filter dropdown and badge color now come from the course's
  populated `trackId.name`/`trackId.color`.

### Public

- `client/src/user/pages/sections/TracksSection.jsx` — drops
  `useLandingData()` and `useSiteContent("landing")` entirely for this
  section. Fetches `GET /api/public/tracks` on mount, renders the same card
  layout already in place (color swatch, name, description, "Explore
  track" CTA). Each card's `onClick` navigates to
  `` `/courses?track=${track.slug}` `` instead of the generic `buttonLink`.
  The section's static eyebrow/headline text ("What we offer", "We deliver N
  specialised tracks") is kept as local hardcoded copy (no longer sourced
  from the CMS section for this specific piece), with N computed from the
  fetched track count.
- `client/src/user/pages/CoursesPage.jsx`:
  - `MEDICAL_SPECIALTIES` and `CATEGORY_COLORS` are removed.
  - Tracks are fetched from `GET /api/public/tracks` on mount; the
    "Category" `FilterDropdown` becomes a "Track" filter populated from this
    list (still multi-select, same `FilterDropdown`/`activeCategories`-style
    `Set` state, renamed to reflect tracks).
  - On mount, the component reads `?track=<slug>` from the URL (via
    `useSearchParams` or `window.location.search`) and pre-populates the
    active-tracks filter `Set` with the matching track before the first
    render of the filtered list.
  - Filtering logic changes from comparing `course.category` (string) to
    comparing `course.trackId` (populate the course list response with
    track `name`/`slug`/`color` so the client can filter/display without a
    second round-trip).
  - `CourseCard`'s category badge now shows the populated track's
    `name`/`color` instead of the old substring-matched gradient.
- Any other course-detail/course-card component that displayed
  `course.category` (`CourseDetail.jsx`, `CourseBar.jsx`, etc.) is updated
  to display the populated track's `name` instead.

## Error handling

| Case | Behavior |
|---|---|
| Admin creates a course without selecting a track | Form validation blocks submit client-side; server also rejects with a 400 if `trackId` is missing (defense in depth). |
| Admin tries to delete a track with courses assigned | `409` from the API with an explicit count and message; admin UI surfaces this as an alert, deletion does not proceed. |
| Admin creates a track with a duplicate name | `400`/`409` from the unique-index violation, surfaced as a form validation error. |
| `?track=<slug>` in the URL doesn't match any known track | `CoursesPage` ignores the param silently (shows the unfiltered full catalogue) rather than erroring. |
| Migration script run a second time | No-op for tracks that already exist (matched by name) and courses that already have `trackId` set — safe to re-run. |
| A course's `trackId` references a track that was somehow deleted (shouldn't happen given the delete-block, but as defense in depth for old data) | `.populate("trackId")` returns `null` for that field; UI falls back to showing "Uncategorized" rather than crashing. |

## Testing

Given the current repo state (Node's built-in `node:test` established for
the server in the prior currency-pricing feature, no frontend test
framework):

- Backend unit tests for the `Track` controller: create/update/delete
  happy paths, delete-blocked-when-courses-assigned, duplicate-name
  rejection, slug generation and collision-suffix behavior.
- Backend test for the migration script's core logic (distinct-category
  extraction and idempotent re-run behavior), run against a lightweight
  in-memory fixture rather than a live DB if practical, matching how prior
  server tests in this repo mock Mongoose model calls.
- No new frontend automated tests (matches existing project convention);
  manual verification: admin can add/edit/delete a track; deleting a track
  with courses assigned is blocked; home page renders live tracks and
  navigates to a correctly-filtered courses page; courses page's track
  filter pre-populates from the URL param and remains multi-select
  afterward.
