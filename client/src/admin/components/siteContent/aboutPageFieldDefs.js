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

export const PAGE_NAV_GROUPS = [
  {
    heading: "Landing Page",
    pages: [{ pageKey: "landing", label: "Landing Page" }],
  },
  {
    heading: "About Pages",
    pages: [
      { pageKey: "mission-vision", label: "Mission & Vision" },
      { pageKey: "board-of-directors", label: "Board of Directors" },
      { pageKey: "mena-board", label: "MENA Board" },
      { pageKey: "scientific-committee", label: "Scientific Committee" },
      { pageKey: "clinical-advisors", label: "Clinical Advisors" },
      { pageKey: "business-partners", label: "Business Partners" },
      { pageKey: "scientific-partners", label: "Scientific Partners" },
      { pageKey: "policies", label: "Policies" },
    ],
  },
];
