# Site Content Editor Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every one of the 9 real public content pages (landing + 8 About pages) becomes editable through a structured, pre-filled, image-upload-capable admin form — no raw JSON, no static XML files, MongoDB as the sole source of truth.

**Architecture:** `PageContent` gains a `pageData: Mixed` field for the 8 About pages' page-specific content (landing keeps its existing `hero`/`sections` shape, extended with 4 new hero fields). The admin `SiteContent.jsx` editor is rebuilt around shared, reusable field components (`TextField`, `TextAreaField`, `ImageUploadField`, `RepeatingList`) driven by a per-page field-definition, replacing the single generic form + JSON textarea. Each About page's public component switches from fetching its own static XML file to `useSiteContent(pageKey)` reading `content.pageData`. All static XML files and the XML-parsing utilities are deleted.

**Tech Stack:** Node.js/Express/Mongoose (server), React 19 + Vite + React Router (client). Node's built-in `node:test` for backend tests; no frontend test framework — frontend changes verified via `npm run build` and manual checks.

## Global Constraints

- Base64-data-URL image storage only (FileReader → base64 → String field), matching every other upload in this codebase — no multer, no cloud storage, no new upload endpoint.
- Client-side image size cap: 2 MB per image, enforced before the file is read, with a clear user-facing error message (mirroring `CourseForm.jsx`'s existing 10 MB video cap pattern).
- No raw JSON editing surface remains for any of the 9 pages after this work — every field is a structured input.
- Opening the editor for any page pre-fills every field from that page's current live `PageContent` document.
- The 8 About pages' `pageData` shapes mirror their old XML shapes 1:1 (translated to camelCase), each gaining an image field (`photoUrl` or `logoUrl`) that didn't exist before.
- `why-us`, `about-us`, `user-home`, `courses` pageKeys and `client/src/user/pages/WhyUsPage.jsx` are out of scope — untouched.
- All 9 files under `client/public/data/*.xml`, plus `client/src/user/utils/parseLandingXml.js` and `client/src/user/utils/LandingDataContext.jsx`, are deleted by the end of this plan.

---

## File Structure

**Backend — modified files:**
- `server/Models/PageContent.js` — add `pageData: Mixed`; extend `hero` sub-schema with `headlineHighlight`, `rating`, `workshopBadge`, `stats`.
- `server/Controllers/pageContent.js` — `updatePageContent` accepts/persists `pageData`; add per-pageKey required-key validation.
- `server/Controllers/pageContent.test.js` — new test file for the validation logic.

**Frontend — new files:**
- `client/src/admin/components/siteContent/TextField.jsx`
- `client/src/admin/components/siteContent/TextAreaField.jsx`
- `client/src/admin/components/siteContent/ImageUploadField.jsx`
- `client/src/admin/components/siteContent/RepeatingList.jsx`
- `client/src/admin/components/siteContent/aboutPageFieldDefs.js` — the 8 About pages' field-definition objects driving `RepeatingList`/form rendering.
- `client/src/admin/components/siteContent/AboutPageEditor.jsx` — generic editor rendering any About page's `pageData` from its field-def.
- `client/src/admin/components/siteContent/LandingEditor.jsx` — structured per-section landing editor (replaces the JSON textarea).

**Frontend — modified files:**
- `client/src/admin/pages/SiteContent.jsx` — becomes a thin page-type switcher delegating to `LandingEditor` or `AboutPageEditor`.
- `client/src/user/pages/sections/HeroSection.jsx` and the 8 other `client/src/user/pages/sections/*.jsx` — drop `useLandingData()`, use only `useSiteContent("landing")` + hardcoded default.
- `client/src/user/pages/about-us/MissionVision.jsx`, `BoardOfDirectors.jsx`, `MENABoard.jsx`, `ScientificCommittee.jsx`, `ClinicalAdvisors.jsx`, `BusinessPartners.jsx`, `ScientificPartners.jsx`, `Policies.jsx` — replace XML fetch with `useSiteContent(pageKey)`.

**Frontend — deleted files:**
- `client/public/data/landing-data.xml`, `mission-vision.xml`, `board-of-directors.xml`, `mena-board.xml`, `scientific-committee.xml`, `clinical-advisors.xml`, `business-partners.xml`, `scientific-partners.xml`, `policies.xml`.
- `client/src/user/utils/parseLandingXml.js`, `client/src/user/utils/LandingDataContext.jsx`.

---

### Task 1: `PageContent` schema — `pageData` and extended `hero`

**Files:**
- Modify: `server/Models/PageContent.js`

**Interfaces:**
- Produces: `PageContent.pageData: Mixed` (default `{}`); `PageContent.hero.headlineHighlight: String`, `.hero.rating: {value: Number, reviews: Number}`, `.hero.workshopBadge: {title: String, subtitle: String}`, `.hero.stats: [{value: String, label: String}]`.

- [ ] **Step 1: Edit the schema**

In `server/Models/PageContent.js`, add to the `hero` sub-object (after the existing `buttonLink` field, before the closing `},` of `hero`):

```js
      headlineHighlight: {
        type: String,
        default: "",
      },
      rating: {
        value: { type: Number, default: 0 },
        reviews: { type: Number, default: 0 },
      },
      workshopBadge: {
        title: { type: String, default: "" },
        subtitle: { type: String, default: "" },
      },
      stats: {
        type: [
          {
            value: { type: String, default: "" },
            label: { type: String, default: "" },
          },
        ],
        default: [],
      },
```

Add a new top-level field after `sections`:

```js
    pageData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
```

- [ ] **Step 2: Verify it loads without syntax errors**

Run: `cd server && node -e "require('mongoose'); const PageContent = require('./Models/PageContent.js'); console.log(Object.keys(PageContent.schema.paths))"`
Expected: prints an array including `pageData`, `hero.headlineHighlight`, `hero.rating.value`, `hero.workshopBadge.title`, `hero.stats`.

- [ ] **Step 3: Commit**

```bash
git add server/Models/PageContent.js
git commit -m "feat: add pageData field and extend hero schema on PageContent"
```

---

### Task 2: Per-pageKey required-field validation

**Files:**
- Create: `server/Controllers/pageContent.test.js`
- Modify: `server/Controllers/pageContent.js`

**Interfaces:**
- Produces: `validatePageData(pageKey, pageData) -> string | null` — returns an error message string if a required top-level key is missing/empty for that pageKey, or `null` if valid. Exported for testing.
- Consumed by: `updatePageContent`, which returns 400 with that message when validation fails.

- [ ] **Step 1: Write the failing tests**

```js
// server/Controllers/pageContent.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test Controllers/pageContent.test.js`
Expected: FAIL — `validatePageData is not a function` or similar (not yet exported).

- [ ] **Step 3: Write the validation function and wire it into `updatePageContent`**

In `server/Controllers/pageContent.js`, add after the existing `createSystemLog` function:

```js
function validatePageData(pageKey, pageData) {
  const data = pageData || {};

  if (pageKey === "mission-vision") {
    if (!data.mission) return "Mission is required";
    if (!data.vision) return "Vision is required";
    return null;
  }

  if (pageKey === "board-of-directors" || pageKey === "mena-board") {
    if (!Array.isArray(data.members) || data.members.length === 0) {
      return "At least one member is required";
    }
    return null;
  }

  if (pageKey === "scientific-committee") {
    if (!Array.isArray(data.countries) || data.countries.length === 0) {
      return "At least one country is required";
    }
    return null;
  }

  if (pageKey === "clinical-advisors") {
    if (!Array.isArray(data.advisors) || data.advisors.length === 0) {
      return "At least one advisor is required";
    }
    return null;
  }

  if (pageKey === "business-partners" || pageKey === "scientific-partners") {
    if (!Array.isArray(data.partners) || data.partners.length === 0) {
      return "At least one partner is required";
    }
    return null;
  }

  if (pageKey === "policies") {
    if (!Array.isArray(data.policies) || data.policies.length === 0) {
      return "At least one policy is required";
    }
    return null;
  }

  return null;
}
```

Update `updatePageContent`'s body: destructure `pageData` alongside the existing fields, call `validatePageData` before the `findOneAndUpdate`, and include `pageData` in the `$set`:

```js
const updatePageContent = async function (req, res) {
  try {
    const { pageKey } = req.params;

    const {
      pageName,
      title,
      description,
      hero,
      sections,
      pageData,
      isPublished,
    } = req.body;

    const validationError = validatePageData(pageKey, pageData);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const admin = getCurrentAdmin(req);

    const updatedPage = await PageContent.findOneAndUpdate(
      { pageKey },
      {
        $set: {
          pageKey,
          pageName: pageName || pageKey,
          title: title || "",
          description: description || "",
          hero: hero || {},
          sections: Array.isArray(sections) ? sections : [],
          pageData: pageData || {},
          isPublished: typeof isPublished === "boolean" ? isPublished : true,
          updatedByName: getAdminName(admin),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    await createSystemLog({
      action: "Page Content Updated",
      module: "Settings",
      description: `${getAdminName(admin)} updated ${updatedPage.pageName}`,
      status: "Success",
      statusCode: 200,
      actorName: getAdminName(admin),
    });

    return res.status(200).json({
      message: "Page content updated successfully",
      page: updatedPage,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update page content",
      error: error.message,
    });
  }
};
```

Add `validatePageData` to the file's `module.exports`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test Controllers/pageContent.test.js`
Expected: PASS — all 8 tests green.

- [ ] **Step 5: Verify no regressions**

Run: `cd server && node --test`
Expected: all suites pass, including the new one.

- [ ] **Step 6: Commit**

```bash
git add server/Controllers/pageContent.js server/Controllers/pageContent.test.js
git commit -m "feat: validate required pageData fields per pageKey on save"
```

---

### Task 3: Shared field components — `TextField`, `TextAreaField`

**Files:**
- Create: `client/src/admin/components/siteContent/TextField.jsx`
- Create: `client/src/admin/components/siteContent/TextAreaField.jsx`

**Interfaces:**
- Produces: `TextField({ label, value, onChange, required })`, `TextAreaField({ label, value, onChange, rows, required })` — both controlled, both styled consistently with the rest of the admin panel (mirroring `EducationalCenterForm.jsx`'s `Input`/`Textarea` helpers).

- [ ] **Step 1: Write `TextField.jsx`**

```jsx
// client/src/admin/components/siteContent/TextField.jsx
export default function TextField({ label, value, onChange, required = false }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </label>

      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-12 rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] px-4 outline-none focus:border-[#D62828]"
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `TextAreaField.jsx`**

```jsx
// client/src/admin/components/siteContent/TextAreaField.jsx
export default function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  required = false,
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </label>

      <textarea
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] px-4 py-3 outline-none focus:border-[#D62828] resize-y"
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/admin/components/siteContent/TextField.jsx client/src/admin/components/siteContent/TextAreaField.jsx
git commit -m "feat: add shared TextField and TextAreaField components for site content editing"
```

---

### Task 4: `ImageUploadField`

**Files:**
- Create: `client/src/admin/components/siteContent/ImageUploadField.jsx`

**Interfaces:**
- Produces: `ImageUploadField({ label, value, onChange })` — `value` is a base64 data-URL string (or empty), `onChange(newValue)` fires with the new base64 string on successful upload, or is not called if the file is rejected (over size cap). Renders a thumbnail preview when `value` is set, plus a "Remove" button that calls `onChange("")`.

- [ ] **Step 1: Write the component**

```jsx
// client/src/admin/components/siteContent/ImageUploadField.jsx
import { useState } from "react";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export default function ImageUploadField({ label, value, onChange }) {
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(
        `Image is too large (max ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))} MB).`
      );
      return;
    }

    setError("");

    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ""));
    reader.onerror = () => setError("Failed to read the image file.");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </label>

      {value && (
        <div className="mb-3 relative inline-block">
          <img
            src={value}
            alt=""
            className="w-24 h-24 object-cover rounded-xl border border-[#DDDDDD]"
          />

          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#D62828] text-white text-xs font-bold flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-[#333333]"
      />

      {error && <p className="text-xs text-[#D62828] mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/admin/components/siteContent/ImageUploadField.jsx
git commit -m "feat: add ImageUploadField component with 2MB size cap"
```

---

### Task 5: `RepeatingList`

**Files:**
- Create: `client/src/admin/components/siteContent/RepeatingList.jsx`

**Interfaces:**
- Consumes: `TextField`, `TextAreaField`, `ImageUploadField` (Tasks 3, 4).
- Produces: `RepeatingList({ label, items, onChange, itemFields, emptyItem })` — `itemFields` is an array of `{ name, label, type: "text"|"textarea"|"image", required? }` describing each sub-object's fields. Renders one card per item with those fields, plus Add/Remove/Move-up/Move-down controls. `onChange(newItemsArray)` fires on any mutation.

- [ ] **Step 1: Write the component**

```jsx
// client/src/admin/components/siteContent/RepeatingList.jsx
import TextField from "./TextField";
import TextAreaField from "./TextAreaField";
import ImageUploadField from "./ImageUploadField";

export default function RepeatingList({
  label,
  items,
  onChange,
  itemFields,
  emptyItem,
}) {
  const list = Array.isArray(items) ? items : [];

  function updateItem(index, fieldName, value) {
    const next = list.map((item, i) =>
      i === index ? { ...item, [fieldName]: value } : item
    );
    onChange(next);
  }

  function addItem() {
    onChange([...list, { ...emptyItem }]);
  }

  function removeItem(index) {
    onChange(list.filter((_, i) => i !== index));
  }

  function moveItem(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const next = [...list];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-bold uppercase tracking-widest text-[#333333]">
          {label}
        </label>

        <button
          type="button"
          onClick={addItem}
          className="text-xs font-bold text-[#D62828] hover:underline"
        >
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {list.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-[#DDDDDD] bg-white p-4"
          >
            <div className="flex items-center justify-end gap-2 mb-3">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="text-xs font-bold text-[#333333]/60 hover:text-[#D62828] disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === list.length - 1}
                className="text-xs font-bold text-[#333333]/60 hover:text-[#D62828] disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs font-bold text-[#D62828] hover:underline"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemFields.map((field) => {
                if (field.type === "image") {
                  return (
                    <ImageUploadField
                      key={field.name}
                      label={field.label}
                      value={item[field.name]}
                      onChange={(value) => updateItem(index, field.name, value)}
                    />
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div key={field.name} className="md:col-span-2">
                      <TextAreaField
                        label={field.label}
                        value={item[field.name]}
                        onChange={(value) => updateItem(index, field.name, value)}
                        required={field.required}
                      />
                    </div>
                  );
                }

                return (
                  <TextField
                    key={field.name}
                    label={field.label}
                    value={item[field.name]}
                    onChange={(value) => updateItem(index, field.name, value)}
                    required={field.required}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <p className="text-sm text-[#333333]/50 italic">
            No items yet — click "+ Add" to create one.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/admin/components/siteContent/RepeatingList.jsx
git commit -m "feat: add RepeatingList component for editing arrays of sub-items"
```

---

### Task 6: About-page field definitions

**Files:**
- Create: `client/src/admin/components/siteContent/aboutPageFieldDefs.js`

**Interfaces:**
- Produces: `ABOUT_PAGE_FIELD_DEFS: { [pageKey]: { type: "flat-list" | "grouped-list" | "custom", ... } }` — a lookup table Task 7's `AboutPageEditor` uses to know each About page's shape.

- [ ] **Step 1: Write the field definitions**

```js
// client/src/admin/components/siteContent/aboutPageFieldDefs.js

const MEMBER_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "title", label: "Title", type: "text" },
  { name: "institution", label: "Institution", type: "text" },
  { name: "specialty", label: "Specialty", type: "text" },
  { name: "photoUrl", label: "Photo", type: "image" },
];

const EMPTY_MEMBER = {
  name: "",
  title: "",
  institution: "",
  specialty: "",
  photoUrl: "",
};

const ADVISOR_FIELDS = [
  ...MEMBER_FIELDS,
  { name: "expertise", label: "Expertise", type: "textarea" },
];

const EMPTY_ADVISOR = { ...EMPTY_MEMBER, expertise: "" };

const PARTNER_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "fullName", label: "Full Name (optional)", type: "text" },
  { name: "country", label: "Country", type: "text" },
  { name: "type", label: "Type", type: "text" },
  { name: "website", label: "Website", type: "text" },
  { name: "logoUrl", label: "Logo", type: "image" },
  { name: "desc", label: "Description", type: "textarea" },
];

const EMPTY_PARTNER = {
  name: "",
  fullName: "",
  country: "",
  type: "",
  website: "",
  logoUrl: "",
  desc: "",
};

export const ABOUT_PAGE_FIELD_DEFS = {
  "mission-vision": {
    type: "custom",
    kind: "mission-vision",
  },

  "board-of-directors": {
    type: "flat-list",
    arrayKey: "members",
    label: "Members",
    itemFields: [
      ...MEMBER_FIELDS,
      { name: "bio", label: "Bio", type: "textarea" },
    ],
    emptyItem: { ...EMPTY_MEMBER, bio: "" },
  },

  "mena-board": {
    type: "flat-list",
    arrayKey: "members",
    label: "Members",
    itemFields: MEMBER_FIELDS,
    emptyItem: EMPTY_MEMBER,
  },

  "scientific-committee": {
    type: "grouped-list",
    arrayKey: "countries",
    label: "Countries",
    groupFields: [{ name: "name", label: "Country Name", type: "text", required: true }],
    emptyGroup: { name: "", members: [] },
    memberArrayKey: "members",
    memberFields: MEMBER_FIELDS,
    emptyMember: EMPTY_MEMBER,
  },

  "clinical-advisors": {
    type: "flat-list",
    arrayKey: "advisors",
    label: "Advisors",
    itemFields: ADVISOR_FIELDS,
    emptyItem: EMPTY_ADVISOR,
  },

  "business-partners": {
    type: "flat-list",
    arrayKey: "partners",
    label: "Partners",
    itemFields: PARTNER_FIELDS,
    emptyItem: EMPTY_PARTNER,
  },

  "scientific-partners": {
    type: "flat-list",
    arrayKey: "partners",
    label: "Partners",
    itemFields: PARTNER_FIELDS,
    emptyItem: EMPTY_PARTNER,
  },

  policies: {
    type: "custom",
    kind: "policies",
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/admin/components/siteContent/aboutPageFieldDefs.js
git commit -m "feat: add per-page field definitions for the 8 About pages"
```

---

### Task 7: `AboutPageEditor`

**Files:**
- Create: `client/src/admin/components/siteContent/AboutPageEditor.jsx`

**Interfaces:**
- Consumes: `ABOUT_PAGE_FIELD_DEFS` (Task 6); `TextField`, `TextAreaField`, `RepeatingList` (Tasks 3, 5).
- Produces: `AboutPageEditor({ pageKey, pageData, onChange })` — renders the correct editor shape for the given `pageKey` (flat-list, grouped-list, or the two custom shapes), calling `onChange(newPageData)` on any field change.

- [ ] **Step 1: Write the component**

```jsx
// client/src/admin/components/siteContent/AboutPageEditor.jsx
import TextField from "./TextField";
import TextAreaField from "./TextAreaField";
import RepeatingList from "./RepeatingList";
import { ABOUT_PAGE_FIELD_DEFS } from "./aboutPageFieldDefs";

export default function AboutPageEditor({ pageKey, pageData, onChange }) {
  const def = ABOUT_PAGE_FIELD_DEFS[pageKey];

  if (!def) {
    return (
      <p className="text-sm text-[#333333]/60">
        No editor is defined for this page yet.
      </p>
    );
  }

  function updateData(partial) {
    onChange({ ...pageData, ...partial });
  }

  if (def.type === "flat-list") {
    return (
      <RepeatingList
        label={def.label}
        items={pageData?.[def.arrayKey] || []}
        onChange={(items) => updateData({ [def.arrayKey]: items })}
        itemFields={def.itemFields}
        emptyItem={def.emptyItem}
      />
    );
  }

  if (def.type === "grouped-list") {
    const groups = pageData?.[def.arrayKey] || [];

    function updateGroup(index, partial) {
      const next = groups.map((g, i) => (i === index ? { ...g, ...partial } : g));
      updateData({ [def.arrayKey]: next });
    }

    function addGroup() {
      updateData({ [def.arrayKey]: [...groups, { ...def.emptyGroup, [def.memberArrayKey]: [] }] });
    }

    function removeGroup(index) {
      updateData({ [def.arrayKey]: groups.filter((_, i) => i !== index) });
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#333333]">
            {def.label}
          </label>

          <button
            type="button"
            onClick={addGroup}
            className="text-xs font-bold text-[#D62828] hover:underline"
          >
            + Add Country
          </button>
        </div>

        <div className="space-y-6">
          {groups.map((group, index) => (
            <div key={index} className="rounded-2xl border border-[#DDDDDD] bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                {def.groupFields.map((field) => (
                  <div key={field.name} className="flex-1 mr-3">
                    <TextField
                      label={field.label}
                      value={group[field.name]}
                      onChange={(value) => updateGroup(index, { [field.name]: value })}
                      required={field.required}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => removeGroup(index)}
                  className="text-xs font-bold text-[#D62828] hover:underline shrink-0"
                >
                  Remove Country
                </button>
              </div>

              <RepeatingList
                label={`${group.name || "Country"} — Members`}
                items={group[def.memberArrayKey] || []}
                onChange={(members) => updateGroup(index, { [def.memberArrayKey]: members })}
                itemFields={def.memberFields}
                emptyItem={def.emptyMember}
              />
            </div>
          ))}

          {groups.length === 0 && (
            <p className="text-sm text-[#333333]/50 italic">
              No countries yet — click "+ Add Country" to create one.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (def.kind === "mission-vision") {
    const mission = pageData?.mission || { eyebrow: "", body: "" };
    const vision = pageData?.vision || { eyebrow: "", body: "" };
    const values = pageData?.values || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Mission Eyebrow"
            value={mission.eyebrow}
            onChange={(value) => updateData({ mission: { ...mission, eyebrow: value } })}
          />
          <TextField
            label="Vision Eyebrow"
            value={vision.eyebrow}
            onChange={(value) => updateData({ vision: { ...vision, eyebrow: value } })}
          />
          <TextAreaField
            label="Mission Body"
            value={mission.body}
            onChange={(value) => updateData({ mission: { ...mission, body: value } })}
          />
          <TextAreaField
            label="Vision Body"
            value={vision.body}
            onChange={(value) => updateData({ vision: { ...vision, body: value } })}
          />
        </div>

        <RepeatingList
          label="Values"
          items={values}
          onChange={(items) => updateData({ values: items })}
          itemFields={[
            { name: "title", label: "Title", type: "text", required: true },
            { name: "desc", label: "Description", type: "textarea" },
          ]}
          emptyItem={{ title: "", desc: "" }}
        />
      </div>
    );
  }

  if (def.kind === "policies") {
    const policies = pageData?.policies || [];

    function updatePolicy(index, partial) {
      const next = policies.map((p, i) => (i === index ? { ...p, ...partial } : p));
      updateData({ policies: next });
    }

    function addPolicy() {
      updateData({
        policies: [
          ...policies,
          { title: "", slug: "", lastUpdated: "", sections: [] },
        ],
      });
    }

    function removePolicy(index) {
      updateData({ policies: policies.filter((_, i) => i !== index) });
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#333333]">
            Policies
          </label>

          <button
            type="button"
            onClick={addPolicy}
            className="text-xs font-bold text-[#D62828] hover:underline"
          >
            + Add Policy
          </button>
        </div>

        <div className="space-y-6">
          {policies.map((policy, index) => (
            <div key={index} className="rounded-2xl border border-[#DDDDDD] bg-white p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <TextField
                  label="Title"
                  value={policy.title}
                  onChange={(value) => updatePolicy(index, { title: value })}
                  required
                />
                <TextField
                  label="Slug"
                  value={policy.slug}
                  onChange={(value) => updatePolicy(index, { slug: value })}
                  required
                />
                <TextField
                  label="Last Updated"
                  value={policy.lastUpdated}
                  onChange={(value) => updatePolicy(index, { lastUpdated: value })}
                />
              </div>

              <RepeatingList
                label="Sections"
                items={policy.sections || []}
                onChange={(sections) => updatePolicy(index, { sections })}
                itemFields={[
                  { name: "heading", label: "Heading", type: "text", required: true },
                  { name: "body", label: "Body", type: "textarea" },
                ]}
                emptyItem={{ heading: "", body: "" }}
              />

              <button
                type="button"
                onClick={() => removePolicy(index)}
                className="mt-4 text-xs font-bold text-[#D62828] hover:underline"
              >
                Remove Policy
              </button>
            </div>
          ))}

          {policies.length === 0 && (
            <p className="text-sm text-[#333333]/50 italic">
              No policies yet — click "+ Add Policy" to create one.
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/admin/components/siteContent/AboutPageEditor.jsx
git commit -m "feat: add AboutPageEditor rendering flat-list, grouped-list, and custom page shapes"
```

---

### Task 8: `LandingEditor`

**Files:**
- Create: `client/src/admin/components/siteContent/LandingEditor.jsx`

**Interfaces:**
- Consumes: `TextField`, `TextAreaField`, `ImageUploadField`, `RepeatingList` (Tasks 3, 4, 5).
- Produces: `LandingEditor({ pageData, onHeroChange, onSectionsChange })` — `pageData` here refers to the existing `{ hero, sections }` shape (not the new About-page `pageData` field — naming is unfortunately close but this component operates on the landing page's pre-existing `hero`/`sections` top-level fields passed in directly). Renders the hero fields (including the 4 new ones from Task 1) plus one collapsible block per known section key.

- [ ] **Step 1: Write the component**

```jsx
// client/src/admin/components/siteContent/LandingEditor.jsx
import { useState } from "react";
import TextField from "./TextField";
import TextAreaField from "./TextAreaField";
import ImageUploadField from "./ImageUploadField";
import RepeatingList from "./RepeatingList";

const SECTION_KEYS = [
  { key: "trusted", label: "Trusted By" },
  { key: "about", label: "About" },
  { key: "tracks", label: "Tracks" },
  { key: "why-us", label: "Why Us" },
  { key: "events", label: "Events" },
  { key: "verify", label: "Verify" },
  { key: "contact", label: "Contact" },
  { key: "footer-cta", label: "Footer CTA" },
];

const EMPTY_ITEM_FIELDS = [
  { name: "title", label: "Title", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

function findSection(sections, key) {
  return sections.find((s) => s.key === key) || {
    key,
    title: "",
    subtitle: "",
    body: "",
    imageUrl: "",
    buttonText: "",
    buttonLink: "",
    items: [],
  };
}

export default function LandingEditor({ hero, sections, onHeroChange, onSectionsChange }) {
  const [openSection, setOpenSection] = useState(null);

  function updateHero(partial) {
    onHeroChange({ ...hero, ...partial });
  }

  function updateSection(key, partial) {
    const current = findSection(sections, key);
    const updated = { ...current, ...partial };
    const withoutKey = sections.filter((s) => s.key !== key);
    onSectionsChange([...withoutKey, updated]);
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-extrabold heading-font mb-4">Hero</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Badge / Subtitle" value={hero.subtitle} onChange={(v) => updateHero({ subtitle: v })} />
          <TextField label="Headline" value={hero.title} onChange={(v) => updateHero({ title: v })} />
          <TextField label="Headline Highlight" value={hero.headlineHighlight} onChange={(v) => updateHero({ headlineHighlight: v })} />
          <TextField label="Button Text" value={hero.buttonText} onChange={(v) => updateHero({ buttonText: v })} />
          <TextField label="Button Link" value={hero.buttonLink} onChange={(v) => updateHero({ buttonLink: v })} />

          <div className="md:col-span-2">
            <TextAreaField label="Subheadline" value={hero.description} onChange={(v) => updateHero({ description: v })} />
          </div>

          <ImageUploadField label="Hero Image" value={hero.imageUrl} onChange={(v) => updateHero({ imageUrl: v })} />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Rating Value"
              value={String(hero.rating?.value ?? "")}
              onChange={(v) => updateHero({ rating: { ...hero.rating, value: Number(v) || 0 } })}
            />
            <TextField
              label="Rating Reviews"
              value={String(hero.rating?.reviews ?? "")}
              onChange={(v) => updateHero({ rating: { ...hero.rating, reviews: Number(v) || 0 } })}
            />
          </div>

          <TextField
            label="Workshop Badge Title"
            value={hero.workshopBadge?.title}
            onChange={(v) => updateHero({ workshopBadge: { ...hero.workshopBadge, title: v } })}
          />
          <TextField
            label="Workshop Badge Subtitle"
            value={hero.workshopBadge?.subtitle}
            onChange={(v) => updateHero({ workshopBadge: { ...hero.workshopBadge, subtitle: v } })}
          />
        </div>

        <div className="mt-4">
          <RepeatingList
            label="Hero Stats"
            items={hero.stats || []}
            onChange={(items) => updateHero({ stats: items })}
            itemFields={[
              { name: "value", label: "Value", type: "text", required: true },
              { name: "label", label: "Label", type: "text" },
            ]}
            emptyItem={{ value: "", label: "" }}
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-extrabold heading-font mb-4">Sections</h3>

        <div className="space-y-3">
          {SECTION_KEYS.map(({ key, label }) => {
            const section = findSection(sections, key);
            const isOpen = openSection === key;

            return (
              <div key={key} className="rounded-2xl border border-[#DDDDDD] bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : key)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-bold heading-font"
                >
                  {label}
                  <span>{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextField label="Eyebrow / Subtitle" value={section.subtitle} onChange={(v) => updateSection(key, { subtitle: v })} />
                      <TextField label="Headline / Title" value={section.title} onChange={(v) => updateSection(key, { title: v })} />
                      <TextField label="Button Text" value={section.buttonText} onChange={(v) => updateSection(key, { buttonText: v })} />
                      <TextField label="Button Link" value={section.buttonLink} onChange={(v) => updateSection(key, { buttonLink: v })} />
                    </div>

                    <TextAreaField label="Body" value={section.body} onChange={(v) => updateSection(key, { body: v })} />

                    <ImageUploadField label="Section Image" value={section.imageUrl} onChange={(v) => updateSection(key, { imageUrl: v })} />

                    <RepeatingList
                      label="Items"
                      items={section.items || []}
                      onChange={(items) => updateSection(key, { items })}
                      itemFields={EMPTY_ITEM_FIELDS}
                      emptyItem={{ title: "", description: "" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/admin/components/siteContent/LandingEditor.jsx
git commit -m "feat: add structured LandingEditor replacing the sections JSON textarea"
```

---

### Task 9: Rebuild `SiteContent.jsx` as a page-type switcher

**Files:**
- Modify: `client/src/admin/pages/SiteContent.jsx`

**Interfaces:**
- Consumes: `LandingEditor` (Task 8), `AboutPageEditor` (Task 7), `getPageContentByKey`/`updatePageContent`/`getPageContentMeta` (existing, `client/src/admin/api/pageContentApi.js`).

- [ ] **Step 1: Rewrite the file**

Replace the full contents of `client/src/admin/pages/SiteContent.jsx`:

```jsx
// client/src/admin/pages/SiteContent.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPageContentByKey,
  getPageContentMeta,
  updatePageContent,
} from "../api/pageContentApi";
import LandingEditor from "../components/siteContent/LandingEditor";
import AboutPageEditor from "../components/siteContent/AboutPageEditor";

const emptyPage = {
  pageKey: "",
  pageName: "",
  title: "",
  description: "",
  hero: {
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    buttonText: "",
    buttonLink: "",
    headlineHighlight: "",
    rating: { value: 0, reviews: 0 },
    workshopBadge: { title: "", subtitle: "" },
    stats: [],
  },
  sections: [],
  pageData: {},
  isPublished: true,
};

export default function SiteContent() {
  const [pages, setPages] = useState([]);
  const [selectedPageKey, setSelectedPageKey] = useState("landing");
  const [pageData, setPageData] = useState(emptyPage);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedPageName = useMemo(() => {
    return (
      pages.find((page) => page.pageKey === selectedPageKey)?.pageName ||
      selectedPageKey
    );
  }, [pages, selectedPageKey]);

  const isLanding = selectedPageKey === "landing";

  async function loadMeta() {
    try {
      const data = await getPageContentMeta();
      setPages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load pages");
    }
  }

  async function loadPage(pageKey) {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const data = await getPageContentByKey(pageKey);

      const safeData = {
        ...emptyPage,
        ...(data || {}),
        hero: {
          ...emptyPage.hero,
          ...(data?.hero || {}),
          rating: { ...emptyPage.hero.rating, ...(data?.hero?.rating || {}) },
          workshopBadge: {
            ...emptyPage.hero.workshopBadge,
            ...(data?.hero?.workshopBadge || {}),
          },
        },
        sections: Array.isArray(data?.sections) ? data.sections : [],
        pageData: data?.pageData || {},
      };

      setPageData(safeData);
    } catch (err) {
      setError(err.message || "Failed to load page content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadPage(selectedPageKey);
  }, [selectedPageKey]);

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setNotice("");

      const payload = {
        ...pageData,
        pageKey: selectedPageKey,
        pageName: pageData.pageName || selectedPageName,
      };

      const result = await updatePageContent(selectedPageKey, payload);

      setPageData((prev) => ({
        ...prev,
        ...(result.page || payload),
      }));

      setNotice("Page content saved successfully");
    } catch (err) {
      setError(err.message || "Failed to save page content");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
              Website Management
            </p>

            <h1 className="text-4xl font-extrabold heading-font">
              Site Content
            </h1>

            <p className="text-[#333333]/70 mt-2">
              Edit user-facing pages from the admin dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/dashboard"
              className="h-12 px-5 rounded-xl bg-[#1A1A1A] text-white text-sm font-bold heading-font flex items-center justify-center gap-2 hover:bg-black transition"
            >
              <span className="material-symbols-outlined text-[20px]">
                dashboard
              </span>
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="h-12 px-6 rounded-xl bg-[#D62828] text-white text-sm font-bold heading-font hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        {notice && (
          <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 px-5 py-4 text-sm font-semibold">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 text-[#D62828] px-5 py-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <section className="mb-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
            Select User Page
          </label>

          <select
            value={selectedPageKey}
            onChange={(e) => setSelectedPageKey(e.target.value)}
            className="w-full h-12 rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] px-4 outline-none focus:border-[#D62828]"
          >
            {pages.map((page) => (
              <option key={page.pageKey} value={page.pageKey}>
                {page.pageName}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-10 text-center text-[#333333]/70">
            Loading page content...
          </div>
        ) : (
          <section className="rounded-3xl bg-white border border-[#E5E5E5] shadow-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold heading-font mb-1">
                {selectedPageName}
              </h2>

              <label className="flex items-center gap-3 mt-3">
                <input
                  type="checkbox"
                  checked={Boolean(pageData.isPublished)}
                  onChange={() =>
                    setPageData((prev) => ({
                      ...prev,
                      isPublished: !prev.isPublished,
                    }))
                  }
                  className="w-5 h-5 accent-[#D62828]"
                />
                <span className="text-sm font-bold heading-font">Published</span>
              </label>
            </div>

            {isLanding ? (
              <LandingEditor
                hero={pageData.hero}
                sections={pageData.sections}
                onHeroChange={(hero) => setPageData((prev) => ({ ...prev, hero }))}
                onSectionsChange={(sections) =>
                  setPageData((prev) => ({ ...prev, sections }))
                }
              />
            ) : (
              <AboutPageEditor
                pageKey={selectedPageKey}
                pageData={pageData.pageData}
                onChange={(data) =>
                  setPageData((prev) => ({ ...prev, pageData: data }))
                }
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Manual verification (if a live server + DB is available)**

Run both dev servers, open the admin Site Content page, select "Landing Page" — confirm the hero fields (including the 4 new ones) and 8 collapsible section blocks render. Select "Mission Vision" — confirm the mission/vision/values custom editor renders. Select "Board Of Directors" — confirm the flat member-list editor renders with an image upload per member. Select "Scientific Committee" — confirm the grouped country/member editor renders. Select "Policies" — confirm the nested policy/section editor renders. Confirm no raw-JSON textarea appears anywhere.

- [ ] **Step 4: Commit**

```bash
git add client/src/admin/pages/SiteContent.jsx
git commit -m "feat: rebuild SiteContent admin page as a structured, page-type-aware editor"
```

---

### Task 10: `useSiteContent` — no change needed, verify

**Files:** none (verification only, documenting why no change is required).

**Interfaces:**
- Confirms: `useSiteContent(pageKey)`'s existing `content` return value already includes whatever fields are on the fetched `PageContent` document — since Task 1 added `pageData` to the schema and it's returned as part of the document by `getPublicPageContentByKey` unchanged, `content.pageData` is already available to consumers with no hook changes.

- [ ] **Step 1: Confirm by reading the current hook and controller**

Run: `grep -n "pageData\|res.json" server/Controllers/pageContent.js client/src/user/hooks/useSiteContent.js`
Expected: `getPublicPageContentByKey` returns the full page document (no field allowlist/stripping), and `useSiteContent` stores `data` as-is into `content` state — confirming `content.pageData` will be populated once Task 1's schema field exists and Task 9's admin editor starts writing to it.

- [ ] **Step 2: No commit needed for this task** (verification only).

---

### Task 11: Rewrite `MissionVision.jsx`

**Files:**
- Modify: `client/src/user/pages/about-us/MissionVision.jsx`

**Interfaces:**
- Consumes: `useSiteContent("mission-vision")` reading `content.pageData.{mission, vision, values}`.

- [ ] **Step 1: Replace the XML fetch with `useSiteContent`**

Replace the full file:

```jsx
// client/src/user/pages/about-us/MissionVision.jsx
import UserNavbar from "../../components/UserNavbar";
import useSiteContent from "../../hooks/useSiteContent";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Verify",  to: "/#verify",  section: "verify"  },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
  { label: "Events",  to: "/#events",  section: "events"  },
  { label: "Contact", to: "/#contact", section: "contact" },
];

export default function MissionVision() {
  const { content } = useSiteContent("mission-vision");
  const mission = content?.pageData?.mission || { eyebrow: "Our Mission", body: "" };
  const vision = content?.pageData?.vision || { eyebrow: "Our Vision", body: "" };
  const values = content?.pageData?.values || [];

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar links={NAV_LINKS} />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">About SonoSchool</p>
        <h1 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          Mission &amp; Vision
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {[mission, vision].map((block) => block && (
            <div key={block.eyebrow} className="bg-softGrey rounded-2xl p-8">
              <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">{block.eyebrow}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{block.body}</p>
            </div>
          ))}
        </div>

        {values.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Our Values</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {values.map((v) => (
                <div key={v.title} className="flex items-start gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-brandRed/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-brandRed" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal text-sm mb-0.5">{v.title}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/user/pages/about-us/MissionVision.jsx
git commit -m "feat: MissionVision page reads from PageContent instead of static XML"
```

---

### Task 12: Rewrite `BoardOfDirectors.jsx` and `MENABoard.jsx`

**Files:**
- Modify: `client/src/user/pages/about-us/BoardOfDirectors.jsx`
- Modify: `client/src/user/pages/about-us/MENABoard.jsx`

**Interfaces:**
- Consumes: `useSiteContent(pageKey)` reading `content.pageData.members`.

- [ ] **Step 1: Read the current `MENABoard.jsx` to confirm its exact JSX (it wasn't read during design research — verify field usage matches `BoardOfDirectors.jsx`'s pattern, e.g. whether it also renders `bio`, before editing)**

Read the file first: `client/src/user/pages/about-us/MENABoard.jsx`. If its JSX differs from `BoardOfDirectors.jsx` (e.g. no `bio` column, since `mena-board.xml` has no `bio` attribute per the design spec), preserve its existing column set — only change the data-fetching logic, not the table layout.

- [ ] **Step 2: Update `BoardOfDirectors.jsx`**

Replace the `fetchData`/`useEffect`/import section:

```jsx
import UserNavbar from "../../components/UserNavbar";
import useSiteContent from "../../hooks/useSiteContent";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Verify",  to: "/#verify",  section: "verify"  },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
  { label: "Events",  to: "/#events",  section: "events"  },
  { label: "Contact", to: "/#contact", section: "contact" },
];

export default function BoardOfDirectors() {
  const { content } = useSiteContent("board-of-directors");
  const members = content?.pageData?.members || [];
```

(The rest of the component's JSX — the table rendering `members.map(...)` — is unchanged, since the field names `name`/`title`/`institution`/`specialty`/`bio` are preserved 1:1 in the new `pageData.members` shape.)

- [ ] **Step 3: Update `MENABoard.jsx` the same way**, reading `useSiteContent("mena-board")` → `content?.pageData?.members`, preserving whatever column set the file already has.

- [ ] **Step 4: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/user/pages/about-us/BoardOfDirectors.jsx client/src/user/pages/about-us/MENABoard.jsx
git commit -m "feat: BoardOfDirectors and MENABoard pages read from PageContent instead of static XML"
```

---

### Task 13: Rewrite `ScientificCommittee.jsx`

**Files:**
- Modify: `client/src/user/pages/about-us/ScientificCommittee.jsx`

**Interfaces:**
- Consumes: `useSiteContent("scientific-committee")` reading `content.pageData.countries` (each `{name, members: [...]}`).

- [ ] **Step 1: Read the current file first** to see its exact per-country rendering JSX (grouped by `<country>` in the XML, per the design research) — this file wasn't fully read during design, so confirm its structure before editing, then apply the same fetch-replacement pattern as Task 11/12: swap the `fetchData()`/`DOMParser` logic for `useSiteContent("scientific-committee")` → `content?.pageData?.countries || []`, keeping the existing per-country/per-member JSX structure unchanged (only the data source changes, field names `name`/`title`/`institution`/`specialty` are preserved 1:1).

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/user/pages/about-us/ScientificCommittee.jsx
git commit -m "feat: ScientificCommittee page reads from PageContent instead of static XML"
```

---

### Task 14: Rewrite `ClinicalAdvisors.jsx`

**Files:**
- Modify: `client/src/user/pages/about-us/ClinicalAdvisors.jsx`

**Interfaces:**
- Consumes: `useSiteContent("clinical-advisors")` reading `content.pageData.advisors`.

- [ ] **Step 1: Read the current file first**, then apply the same fetch-replacement pattern: swap `fetchData()`/`DOMParser` for `useSiteContent("clinical-advisors")` → `content?.pageData?.advisors || []`, preserving the existing JSX structure and field names (`name`/`title`/`institution`/`specialty`/`expertise`).

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/user/pages/about-us/ClinicalAdvisors.jsx
git commit -m "feat: ClinicalAdvisors page reads from PageContent instead of static XML"
```

---

### Task 15: Rewrite `BusinessPartners.jsx` and `ScientificPartners.jsx`

**Files:**
- Modify: `client/src/user/pages/about-us/BusinessPartners.jsx`
- Modify: `client/src/user/pages/about-us/ScientificPartners.jsx`

**Interfaces:**
- Consumes: `useSiteContent(pageKey)` reading `content.pageData.partners`.

- [ ] **Step 1: Update `BusinessPartners.jsx`**

Replace the `fetchData`/`useEffect`/import section:

```jsx
import { useState } from "react";
import UserNavbar from "../../components/UserNavbar";
import useSiteContent from "../../hooks/useSiteContent";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Verify",  to: "/#verify",  section: "verify"  },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Why Us",  to: "/#why-us",  section: "why-us"  },
  { label: "Events",  to: "/#events",  section: "events"  },
  { label: "Contact", to: "/#contact", section: "contact" },
];

const TYPE_COLORS = {
  Equipment:    "#1D4ED8",
  Distribution: "#065F46",
  Education:    "#7C3AED",
  Healthcare:   "#D62828",
  Technology:   "#0E7490",
  default:      "#374151",
};

export default function BusinessPartners() {
  const { content } = useSiteContent("business-partners");
  const partners = content?.pageData?.partners || [];
  const [active, setActive] = useState("All");

  const types   = ["All", ...Array.from(new Set(partners.map((p) => p.type)))];
  const visible = active === "All" ? partners : partners.filter((p) => p.type === active);
```

(The rest of the component — the tabs and table JSX — is unchanged; only replace the `p.desc` cell's data source consistently and, since `logoUrl` is now available, optionally render it — not required by this task, image display is covered by the Task 16 regression pass confirming uploaded logos appear if the admin has set one, but no new JSX is strictly required here since the existing table doesn't have a logo column; leave the table layout as-is unless you judge adding a small logo thumbnail column is a trivial, clearly-in-scope addition — if so, add a `<td>` before the Partner name column rendering `p.logoUrl && <img src={p.logoUrl} className="w-8 h-8 rounded object-contain" alt="" />`.)

- [ ] **Step 2: Update `ScientificPartners.jsx` the same way**, reading `useSiteContent("scientific-partners")` → `content?.pageData?.partners`, preserving its existing JSX structure (read the file first to confirm its exact layout, since it wasn't fully read during design — it likely also shows `fullName`, per the XML having that extra attribute unique to this page).

- [ ] **Step 3: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/user/pages/about-us/BusinessPartners.jsx client/src/user/pages/about-us/ScientificPartners.jsx
git commit -m "feat: BusinessPartners and ScientificPartners pages read from PageContent instead of static XML"
```

---

### Task 16: Rewrite `Policies.jsx`

**Files:**
- Modify: `client/src/user/pages/about-us/Policies.jsx`

**Interfaces:**
- Consumes: `useSiteContent("policies")` reading `content.pageData.policies` (each `{title, slug, lastUpdated, sections: [{heading, body}]}`).

- [ ] **Step 1: Read the current file first** to see its exact rendering JSX (it wasn't read during design research), then apply the same fetch-replacement pattern: swap the XML fetch/parse logic for `useSiteContent("policies")` → `content?.pageData?.policies || []`, preserving the existing JSX structure and field names (`title`/`slug`/`lastUpdated`/`sections[].heading`/`sections[].body`).

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/user/pages/about-us/Policies.jsx
git commit -m "feat: Policies page reads from PageContent instead of static XML"
```

---

### Task 17: Remove the landing XML fallback from all 9 landing section components

**Files:**
- Modify: `client/src/user/pages/sections/HeroSection.jsx`
- Modify: `client/src/user/pages/sections/TrustedSection.jsx`
- Modify: `client/src/user/pages/sections/AboutSection.jsx`
- Modify: `client/src/user/pages/sections/TracksSection.jsx` (already rewritten by the separate Course Tracks plan's Task 18 — if that plan has already been executed, this file no longer imports `useLandingData`/`useSiteContent` for tracks at all, since it now fetches from `/api/public/tracks`; if it has NOT been executed yet, skip re-touching this specific file's tracks-fetching logic in this task and only confirm it has no remaining `useLandingData` import to remove)
- Modify: `client/src/user/pages/sections/WhyUsSection.jsx`
- Modify: `client/src/user/pages/sections/EventsSection.jsx`
- Modify: `client/src/user/pages/sections/VerifySection.jsx`
- Modify: `client/src/user/pages/sections/ContactSection.jsx`
- Modify: `client/src/user/pages/sections/FooterCtaSection.jsx`

**Interfaces:**
- Consumes: `useSiteContent("landing")` only (existing hook, no changes) — `useLandingData()` import and every XML-sourced fallback value is removed.

- [ ] **Step 1: For each of the 8 files other than `TracksSection.jsx`, read the file first**, then remove the `import { useLandingData } from "../../utils/LandingDataContext";` line and the `const data = useLandingData();` (or equivalently-named) line, and remove that XML data source from each field's fallback chain — e.g. a line like:

```js
const eyebrow = cmsTracks?.subtitle || xmlTracks.subtitle || "What we offer";
```

becomes:

```js
const eyebrow = cmsTracks?.subtitle || "What we offer";
```

Apply this same "drop the middle XML fallback, keep CMS-first and hardcoded-default-last" transformation to every field in each of the 8 files. Since these components' internal variable names differ file to file, read each file's actual fallback chains before editing — do not guess field names.

- [ ] **Step 2: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors.

- [ ] **Step 3: Grep to confirm no remaining `useLandingData` usage**

```bash
grep -rn "useLandingData\|LandingDataContext" client/src --include="*.jsx" --include="*.js"
```
Expected: no matches (the import declarations themselves, in the files being deleted next in Task 18, are the only remaining references, and those files are deleted in the next task).

- [ ] **Step 4: Commit**

```bash
git add client/src/user/pages/sections/
git commit -m "feat: remove landing-data.xml fallback from all landing page sections"
```

---

### Task 18: Delete XML files and XML-parsing utilities

**Files:**
- Delete: `client/public/data/landing-data.xml`
- Delete: `client/public/data/mission-vision.xml`
- Delete: `client/public/data/board-of-directors.xml`
- Delete: `client/public/data/mena-board.xml`
- Delete: `client/public/data/scientific-committee.xml`
- Delete: `client/public/data/clinical-advisors.xml`
- Delete: `client/public/data/business-partners.xml`
- Delete: `client/public/data/scientific-partners.xml`
- Delete: `client/public/data/policies.xml`
- Delete: `client/src/user/utils/parseLandingXml.js`
- Delete: `client/src/user/utils/LandingDataContext.jsx`
- Modify: any remaining importer of `LandingDataProvider` (search first — likely wraps the app root or the landing page route).

**Interfaces:** none produced — this is pure removal, gated on Tasks 11-17 having removed every consumer first.

- [ ] **Step 1: Confirm there are zero remaining references before deleting**

```bash
grep -rln "landing-data.xml\|mission-vision.xml\|board-of-directors.xml\|mena-board.xml\|scientific-committee.xml\|clinical-advisors.xml\|business-partners.xml\|scientific-partners.xml\|policies.xml\|parseLandingXml\|LandingDataContext\|LandingDataProvider" client/src
```
Expected: only `LandingDataProvider`'s usage site (likely `client/src/App.jsx` or a layout wrapper) shows up — confirm this by reading that file's context around the match.

- [ ] **Step 2: Remove the `LandingDataProvider` wrapper**

If found (e.g. in `App.jsx` wrapping the route tree), remove the `<LandingDataProvider>...</LandingDataProvider>` wrapper (un-nesting its children up one level) and its import line.

- [ ] **Step 3: Delete the files**

```bash
git rm client/public/data/landing-data.xml
git rm client/public/data/mission-vision.xml
git rm client/public/data/board-of-directors.xml
git rm client/public/data/mena-board.xml
git rm client/public/data/scientific-committee.xml
git rm client/public/data/clinical-advisors.xml
git rm client/public/data/business-partners.xml
git rm client/public/data/scientific-partners.xml
git rm client/public/data/policies.xml
git rm client/src/user/utils/parseLandingXml.js
git rm client/src/user/utils/LandingDataContext.jsx
```

- [ ] **Step 4: Verify the build**

Run: `cd client && npm run build 2>&1 | tail -20`
Expected: succeeds with no errors — confirms nothing still imports the deleted files.

- [ ] **Step 5: Re-run the grep from Step 1 to confirm zero remaining references**

```bash
grep -rln "landing-data.xml\|mission-vision.xml\|board-of-directors.xml\|mena-board.xml\|scientific-committee.xml\|clinical-advisors.xml\|business-partners.xml\|scientific-partners.xml\|policies.xml\|parseLandingXml\|LandingDataContext\|LandingDataProvider" client/src client/public
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove static XML data files and XML-parsing utilities"
```

---

### Task 19: Full regression pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend test suite**

Run: `cd server && node --test`
Expected: PASS — all suites green, including Task 2's new `pageContent.test.js`.

- [ ] **Step 2: Run the full client build**

Run: `cd client && npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Grep sweep for any remaining raw-JSON editing surface or XML references**

```bash
grep -rn "sectionsJson\|Sections JSON\|DOMParser\|useLandingData" client/src --include="*.jsx" --include="*.js"
```
Expected: no matches.

- [ ] **Step 4: Manual walkthrough (if a live server + DB is available)**

1. Admin: open Site Content, select each of the 9 pages in turn — confirm every page shows a structured form (no JSON textarea) pre-filled with whatever content currently exists (likely empty/default on a fresh DB, since the old XML data was never in MongoDB).
2. Admin: for "Mission Vision", fill in mission/vision text and add 2 values, save — confirm success message.
3. Public: visit `/about/mission-vision` — confirm the saved content renders (not the old hardcoded XML content, since that data source no longer exists).
4. Admin: for "Board Of Directors", add a member with an uploaded photo, save — confirm the photo renders on `/about/board-of-directors`.
5. Admin: for "Landing Page", edit the Hero section's new Rating/Workshop Badge/Stats fields and the "Tracks" section (or confirm it's driven by the separate Course Tracks feature if that plan has landed), save — confirm the home page reflects the change.
6. Admin: attempt to save "Business Partners" with zero partners — confirm the 400 validation error ("At least one partner is required") is surfaced without losing other in-progress edits.
7. Admin: attempt to upload an image over 2 MB — confirm the client-side size-cap error message appears and the field is not changed.

- [ ] **Step 5: Report status**

If all checks pass, this feature is complete. If any manual check fails, return to the relevant task above and fix before considering the plan done.
