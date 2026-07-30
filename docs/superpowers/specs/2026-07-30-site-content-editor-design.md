# Site Content Editor Rework (v2)

This supersedes `docs/superpowers/specs/2026-07-25-site-content-editor-design.md`,
which was written and committed but never implemented. All of that spec's
content still applies except where explicitly changed below. This document
is self-contained — it restates the full scope rather than requiring the
reader to cross-reference the old file.

## Problem

Editing marketing/informational page content is unnecessarily hard for
non-technical admins, and for 8 of the 9 real public pages, admin editing
doesn't actually work at all today:

- The admin `SiteContent.jsx` editor is a single generic form (page
  name/title/description + 6 hero fields) plus one large raw-JSON
  `<textarea>` covering everything else — every landing-page section
  (tracks, why-us, events, trusted-by, contact, footer CTA, etc.), each with
  its own undocumented field-naming conventions an admin has to reverse
  -engineer from the frontend source to edit correctly. A JSON syntax error
  anywhere aborts the whole save with a generic, unhelpful message.
- That editor writes to the `PageContent` MongoDB collection. But only the
  landing page's section components actually read from `PageContent` (via
  `useSiteContent`) — and even then, layered under a fallback to a static
  `landing-data.xml` file and hardcoded defaults.
- The 8 "About" pages (`/about/mission-vision`, `/about/board-of-directors`,
  `/about/mena-board`, `/about/scientific-committee`,
  `/about/clinical-advisors`, `/about/business-partners`,
  `/about/scientific-partners`, `/about/policies`) are real, nav-linked
  pages — but each fetches its own separate static XML file directly
  (`client/public/data/*.xml`) and never reads `PageContent` at all. The
  `SiteContent.jsx` editor's page-selector dropdown lists these pages'
  `pageKey`s and lets an admin "edit" them, but nothing an admin saves there
  is ever displayed — the edit has no effect.
- No image upload exists anywhere in this editor. Every image-shaped field
  (hero image, partner/business logos) is a plain text URL input, and two of
  the nine pages' XML data (`business-partners.xml`, `scientific-partners.xml`)
  have an always-empty `logo=""` attribute with no way to populate it.
- The Hero section has a "Watch demo" button (`HeroSection.jsx` line
  118-132) that is dead code today — no `href`, no `onClick`, does nothing.
  There is no CMS field to give it a real video.
- Even once fields are structured (not raw JSON), the editor UI itself is
  hard for a non-technical admin: one flat dropdown of 9 technically-named
  pages, every field for every section shown in one long scrolling form, and
  no way to tell which field affects which part of the actual page short of
  guessing or opening the live site in another tab.

## Goals

- Every one of the 9 real public pages (landing + the 8 About pages) is
  editable by a non-technical admin through structured, field-by-field
  forms — no raw JSON required for any of them.
- Opening the editor for a page loads and pre-fills its current live
  content, so editing means changing existing text/images, not rewriting
  from scratch.
- Each page's editor matches that page's actual content shape (mirroring
  what's in its current XML file) — not a one-size-fits-all generic form.
- Image fields (hero image, member/partner/advisor photos and logos) support
  direct file upload from the admin's device, not just a URL paste.
- The Hero section supports a video link that powers a real "Watch demo"
  experience.
- MongoDB (`PageContent`) becomes the single source of truth for all 9
  pages. The static XML files and the client-side XML-parsing code path are
  removed entirely — nothing is read from or written to disk XML files at
  runtime.
- The editor itself is easy to navigate and understand for a non-technical
  admin: pages are found via a plain-language sidebar (not a dropdown of
  technical keys), each page's sections are organized into clearly separated
  collapsible blocks (not one long scrolling form), and admins get a live,
  true-to-the-real-site preview so they can see exactly what a field
  controls as they edit it.

## Non-goals

- The other `PageContent` pageKeys with no real page behind them today
  (`why-us`, `about-us`, `user-home`, `courses`) are out of scope — no
  editor is built for pages that don't exist or aren't rendered anywhere.
  `client/src/user/pages/WhyUsPage.jsx` (already dead code, unrouted) is
  left untouched.
- No new generic/dynamic form-schema engine. Each of the 9 pages gets its
  own explicitly-defined field list in code (a finite, known set), not a
  system for admins to invent arbitrary new page types or fields.
- No image CDN/cloud storage integration — images continue to live as
  base64 strings on the `PageContent` document, matching every other upload
  in this codebase (course thumbnails, videos, materials, certificates).
- No self-hosted video upload — the Hero video is a link to an
  externally-hosted video (YouTube/Vimeo/etc.), embedded via iframe, not a
  file uploaded to and stored by this app.
- No multi-language/localization support.
- No content versioning/revision history beyond what `updatedByName` +
  `updatedAt` already provide.
- No changes to how the live preview is delivered (e.g. no iframe-based
  cross-origin preview, no separate preview server) — it renders the same
  React section components already used by the public site, in-process,
  fed draft state instead of fetched state.

## Current state being replaced

| Page | pageKey | Today's data source | Component |
|---|---|---|---|
| Landing | `landing` | `PageContent` (partial) → `landing-data.xml` fallback → hardcoded | 9 components in `client/src/user/pages/sections/` |
| Mission & Vision | `mission-vision` | `mission-vision.xml` only | `about-us/MissionVision.jsx` |
| Board of Directors | `board-of-directors` | `board-of-directors.xml` only | `about-us/BoardOfDirectors.jsx` |
| MENA Board | `mena-board` | `mena-board.xml` only | `about-us/MENABoard.jsx` |
| Scientific Committee | `scientific-committee` | `scientific-committee.xml` only | `about-us/ScientificCommittee.jsx` |
| Clinical Advisors | `clinical-advisors` | `clinical-advisors.xml` only | `about-us/ClinicalAdvisors.jsx` |
| Business Partners | `business-partners` | `business-partners.xml` only | `about-us/BusinessPartners.jsx` |
| Scientific Partners | `scientific-partners` | `scientific-partners.xml` only | `about-us/ScientificPartners.jsx` |
| Policies | `policies` | `policies.xml` only | `about-us/Policies.jsx` |

All 8 About pages are linked from `UserNavbar.jsx` and are real, live pages
with no working admin edit path today.

## Data model

### `PageContent` schema changes (`server/Models/PageContent.js`)

The existing generic `sections: [{ key, title, subtitle, body, imageUrl,
buttonText, buttonLink, items: Mixed }]` shape stays for the **landing**
page only (it already reasonably fits landing's 9 loosely-similar sections,
and rewriting every landing section component's field-reading logic is out
of scope — this only adds structured editor UI on top, not a restructure of
the stored shape).

For the 8 About pages, a new, page-type-specific field is added to the
schema: `pageData: Mixed` (a single freeform object holding that page's
whole content, shaped per the tables below). Each About page's `pageData`
shape mirrors its old XML shape 1:1, translated to camelCase JS:

- **`mission-vision`**: `{ mission: { eyebrow, body }, vision: { eyebrow,
  body }, values: [{ title, desc }] }`
- **`board-of-directors`** / **`mena-board`**: `{ members: [{ name, title,
  institution, specialty, photoUrl }] }` (adds `photoUrl`, absent from the
  old XML, to support the new image-upload requirement).
- **`scientific-committee`**: `{ countries: [{ name, members: [{ name,
  title, institution, specialty, photoUrl }] }] }` (the one two-level page).
- **`clinical-advisors`**: `{ advisors: [{ name, title, institution,
  specialty, expertise, photoUrl }] }`.
- **`business-partners`** / **`scientific-partners`**: `{ partners: [{
  name, fullName?, country, type, website, logoUrl, desc }] }`
  (`fullName` only meaningfully used by scientific-partners, but included on
  both for shape consistency; empty string when unused).
- **`policies`**: `{ policies: [{ title, slug, lastUpdated, sections: [{
  heading, body }] }] }`.

Why `Mixed` rather than 8 separate strict sub-schemas: these pages'
shapes are static and known, but strict Mongoose sub-schema validation
for 8 different nested-array shapes adds real schema complexity for a
one-admin-team internal tool where the *editor UI* (not the DB layer) is
the actual guardrail against malformed data — the structured form only
ever produces well-shaped objects, since there is no raw-JSON path left
for these pages. Validation lives in the controller (reject if required
top-level keys are missing) and the frontend forms (required fields),
consistent with how `Course.materials`/`items` already use loosely-typed
array storage elsewhere in this codebase.

### `hero` schema change (landing only)

The nested `hero` object gains five fields that today either exist only in
`landing-data.xml` or don't exist anywhere:

- `headlineHighlight` (String), `rating: { value: Number, reviews: Number }`,
  `workshopBadge: { title: String, subtitle: String }`, and `stats: [{
  value: String, label: String }]` — these exist only in `landing-data.xml`
  today. Without adding them to `PageContent`, deleting the XML fallback (a
  required goal of this spec) would silently remove content real visitors
  currently see, since the CMS `hero` schema was never a full superset of
  the XML `hero` shape.
- `videoUrl` (String, default `""`) — **new**, does not exist in the XML or
  the current schema. Populates the Hero section's "Watch demo" button
  (currently dead code with no href/onClick — see Frontend section below).

Every other top-level field (`pageName`, `title`, `description`,
`isPublished`) is unchanged.

## Image storage

Every image field (`hero.imageUrl`, landing section `imageUrl`, and every
new `photoUrl`/`logoUrl` on the About pages) is populated via the same
pattern already used for course thumbnails/videos/materials in this
codebase: a `<input type="file">` + `FileReader.readAsDataURL()` in the
admin UI, producing a base64 data URL string that's submitted as a plain
string field — no new upload endpoint, no multer, no cloud storage. A
client-side size cap (2 MB per image, enforced with the same
user-facing-error-message pattern `CourseForm.jsx` already uses for its 10 MB
video cap) keeps a page document safely under MongoDB's 16 MB limit even
with a full member roster of photos (e.g. Scientific Committee's ~20
members × ≤2 MB is still well within budget, and in practice profile-style
photos compress far smaller than 2 MB).

The XML files' `logo=""` fields (always empty in the current data) become
the first real content in `logoUrl` once an admin uploads a logo through
the new editor.

`hero.videoUrl` is a plain URL string (YouTube/Vimeo/etc. link), not an
uploaded file — see Non-goals.

## Backend

### `server/Models/PageContent.js`

- Add `pageData: { type: mongoose.Schema.Types.Mixed, default: {} }` to the
  top-level schema (used only by the 8 About pages; landing continues using
  `hero`/`sections` and leaves `pageData` empty).
- Add `headlineHighlight`, `rating`, `workshopBadge`, `stats`, and
  `videoUrl` to the `hero` sub-schema as described above.

### `server/Controllers/pageContent.js`

- `updatePageContent`: extend the destructured/`$set` fields to include
  `pageData` (alongside the existing `pageName, title, description, hero,
  sections, isPublished`). Add a light per-pageKey required-top-level-key
  check before saving (e.g. for `pageKey === "mission-vision"`, reject if
  `pageData.mission`/`pageData.vision` are missing) — not full deep
  validation, just enough to catch a broken save before it reaches the
  public site blank.
- `getPageContentByKey`/`getPublicPageContentByKey`: no shape change needed
  — `pageData` and the new `hero` fields ride along automatically as part of
  the existing document fetch/response.
- `defaultPages`: unchanged (already lists all 8 About pageKeys correctly).

### Removed

- No backend code is deleted (the generic `sections`-based machinery stays
  for landing) — this is additive at the schema/controller level.

## Frontend

### Public About pages (8 files under `client/src/user/pages/about-us/`)

Each page component's current `fetch("/data/<name>.xml")` +
`DOMParser`-based parsing is replaced with `useSiteContent(pageKey)` (the
same hook `landing`'s sections already use), reading `content.pageData`
instead of a parsed XML object. Field names in each component's render
logic update from the XML attribute names to the new camelCase
`pageData` shape (e.g. `member.institution` stays the same name, but the
source object changes from a DOM-parsed element to a plain JS object from
the fetched JSON — no attribute-vs-text-node handling needed anymore,
simplifying each component).

### Landing page — Hero video

`HeroSection.jsx`'s existing "Watch demo" button:

- If `cmsHero.videoUrl` is empty, the button does not render at all (no
  dead/non-functional buttons on the live site).
- If set, clicking the button opens a modal/lightbox overlay embedding the
  video (YouTube/Vimeo iframe embed, derived from the URL) over the current
  page — the visitor stays on the landing page rather than navigating away.
  Closing the modal (X button, backdrop click, or Escape key) returns to
  the page unchanged.

### Landing page sections (data consumption)

No other consumption-side changes — `useSiteContent("landing")` and the
existing `sections[]`/`getSection()` pattern are unchanged for every field
except the new Hero ones above. Only the admin editor (below) changes how
this data gets authored.

### Removed

- `client/src/user/utils/parseLandingXml.js`, `LandingDataContext.jsx`, and
  every `useLandingData()` call site in the 9 landing section components
  are deleted — landing's XML-fallback layer is removed, matching the
  "MongoDB becomes sole source of truth, ignore/delete the XML" decision.
  Each landing section component's 3-way fallback (CMS → XML → hardcoded)
  collapses to a 2-way fallback (CMS → hardcoded default string), which is
  simpler code, not just equivalent-but-shorter.
- All 9 files under `client/public/data/*.xml` are deleted.

### Admin editor (`client/src/admin/pages/SiteContent.jsx` and new files)

Full rework, replacing the single generic form + JSON textarea + dropdown
with a page-type-aware structured editor built for non-technical admins:

**Navigation — sidebar, not dropdown.** The page-selector dropdown is
replaced with a persistent left sidebar listing all 9 pages by
plain-language name only (no `pageKey` shown anywhere in the UI), grouped
under two headings: "Landing Page" and "About Pages" (the 8 About pages
listed underneath, in the same order they appear in the site's own nav).
Clicking a page name loads that page's editor in the main panel; the
currently-selected page is visually highlighted in the sidebar.

**Section layout — accordion.** Within a page's editor, its sections render
as collapsible accordion panels — one panel per section (for Landing: Hero,
Trusted, About, Tracks, Why Us, Events, Verify, Contact, Footer CTA; for an
About page: its own named sections, e.g. Mission & Vision's three panels are
Mission, Vision, Values). The first panel is expanded by default; the rest
start collapsed. Each panel header shows the section's plain-language name
(e.g. "Hero Section", not "hero" or a `key` value) so an admin can find the
part of the page they want to change without reading field-level detail
first.

**Fields.** Each About-page form is built from a small typed field-list per
page (mirroring the `pageData` shapes above) using shared, reusable input
components: `TextField`, `TextAreaField`, `ImageUploadField` (file input +
live thumbnail preview + remove button), and a generic `RepeatingList`
component (add/remove/reorder a list of sub-objects, e.g. board members or
policy sections) driven by a per-page field-definition array rather than 8
hand-written bespoke forms — this keeps the 8 About-page editors DRY (shared
list/field components) while still being fully structured (no raw JSON).
The landing page's Hero accordion panel gains a "Video Link" `TextField`
alongside its existing fields (Title, Subtitle, Description, Image, Button
Text, Button Link), labeled to make clear it powers the "Watch demo" button.

On load, the form is fully pre-filled from the fetched
`getPageContentByKey(pageKey)` response — an admin opens the editor and
sees their current live content already in the fields, ready to tweak.

**Live preview — real page rendering.** The current thin sidebar "Preview"
card (plain text/image summary) is replaced with an embedded rendering of
the actual public page components:

- For Landing, the preview area renders the real `HeroSection`,
  `AboutSection`, `TracksSection`, etc. components (the same components the
  public site uses), passed the admin's current in-progress draft state
  instead of data fetched from `useSiteContent`. This requires each section
  component to accept its content as an optional prop override (falling
  back to its existing `useSiteContent`-driven behavior when no override is
  passed, so the public site's normal data flow is unchanged) — a minimal,
  additive change to each component's signature, not a rewrite of its
  render logic.
- For an About page, the preview area renders that page's real component
  (e.g. `MissionVision.jsx`) the same way, fed draft `pageData`.
- The preview updates live as the admin types or uploads an image — no
  separate "refresh preview" step. This directly closes the "which field
  affects what" guessing problem: an admin can see the exact visual result
  of the field they're currently editing.
- The preview is not full-viewport-width like the live site; it renders at
  a fixed, scaled-down container width to fit alongside the form, with
  normal in-page scrolling for content taller than the visible area.

Save button and `isPublished` behavior unchanged.

## Error handling

| Case | Behavior |
|---|---|
| Admin uploads an image over the 2 MB cap | Client-side rejection with a clear message before the file is read, mirroring `CourseForm.jsx`'s existing video-size-cap UX — the field keeps its previous value. |
| Save is attempted with a required top-level `pageData` key missing (e.g. Mission & Vision saved with an empty mission) | Controller rejects with 400 and a specific message naming the missing section; the admin UI surfaces this without losing any of the admin's other in-progress edits (the failed save does not clear the form). |
| A public About page is requested before any admin has ever saved content for it | `getPublicPageContentByKey` behaves as today: `getPageContentByKey`'s auto-create-on-first-read seeds an empty document; the page component renders whatever minimal empty/placeholder state its fallback produces (each About page keeps a hardcoded minimal default, e.g. an empty members list rendering "No members listed yet" rather than crashing). |
| Admin adds/removes items in a `RepeatingList` (e.g. adds a new board member) and doesn't fill in every field before saving | Only genuinely required fields (e.g. `name`) block save; optional fields (e.g. `photoUrl`, `expertise`) can be blank. |
| Old landing-data.xml-only fields with no `PageContent`/`pageData` equivalent (e.g. hero's `headlineHighlight`, `rating`, `workshopBadge`, `stats`, which the CMS `hero` schema never had fields for) | These become newly editable: add the missing fields to the landing `hero`/`sections` structured editor rather than silently dropping content that real visitors currently see (sourced from XML) once the XML fallback is deleted — this is a required part of the XML-removal work, not an incidental gap. |
| Admin enters a non-video or malformed URL in Hero Video Link | The "Watch demo" button still renders (any non-empty string is treated as "set") and attempts to embed it; no server-side URL validation is added — this matches the existing `buttonLink` field's behavior (also unvalidated). |
| Admin opens the editor for a page while the live preview's underlying component throws (e.g. a malformed draft `items[]` shape mid-edit) | The preview panel catches the error via a React error boundary local to the preview area and shows a small "Preview unavailable" placeholder instead of crashing the whole editor — the form itself remains usable and save is unaffected. |

## Testing

- Backend: unit test for `updatePageContent`'s new per-pageKey required-key
  validation (valid save passes; a save missing a required top-level
  `pageData` key is rejected with 400 and a specific message), following
  the `node:test` pattern established in prior features.
- Frontend: no automated test framework exists in this repo (established
  in prior work) — manual verification: for each of the 9 pages, opening
  the admin editor shows the page's current live content pre-filled;
  editing and saving updates the public page; uploading an image displays
  correctly on the public page; removing/adding a repeating-list item
  (e.g. a board member) persists correctly; the two previously-empty
  `logoUrl` fields (business/scientific partners) can now be populated via
  upload and render on the public page; setting a Hero Video Link makes the
  "Watch demo" button appear and open the video in a modal, clearing it
  hides the button again; the live preview panel visually matches the real
  public page for each of the 9 pages after save; typing into a field
  updates the live preview without needing to save first.
