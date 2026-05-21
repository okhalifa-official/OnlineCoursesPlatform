
# Sonoschool SRS — Presentation Brief

> Brief for generating a professional, concise slide deck (~11 slides).
> Source: `SRS.md` (V1.8). Keep each slide light — headline + a few bullets or one table.

---

## Slide 1 — Title

**Sonoschool — Software Requirements Specification**
A web-based academic medical learning platform.

- Team: Mohamed Hany, Malak Foudh, Noureen Mohammed, Omar Khalifa, Badr Mohamed
- MSA — Modern Sciences and Arts University
- Document V1.8

---

## Slide 2 — Business Area

**Domain: online medical education.**

- Sonoschool delivers structured, field-specific courses to healthcare professionals and medical students.
- The problem: medical learning resources are scattered, progress is hard to track, and course completion rarely produces formal proof.
- The solution: one platform that combines **course access + progress tracking + verified completion certificates**.
- Business sub-areas covered by the requirements: Identity & Access, Course Catalog, Payments, Content Delivery, Assessments, Certification, Course Q&A, Course Feedback, Notifications, Content Authoring, Administration, Reporting.

---

## Slide 3 — Stakeholders

| Stakeholder | Role in the system |
|---|---|
| **Visitor** | Unauthenticated user — browses the catalogue and registers an account. |
| **Student** | Primary end user — enrolls, learns, takes exams, earns certificates. |
| **Administrator** | Manages courses, users, exams, settings, and reports. |
| **Instructor** | Stored as a course director reference only — no direct system access. |

**Requirement sources (elicitation interviews):** HR, Operational Director, Medical Director, and Instructor — each interviewed on the areas they own.

---

## Slide 4 — Functional Requirement Categories

**39 base FRs (50 including follow-ons), grouped into 6 functional modules:**

| Module | FRs | Focus |
|---|---|---|
| **1. User & Access Management** | FR-001 – FR-005.1, FR-026 | Registration, login, profile, authorization |
| **2. Course Discovery & Enrollment** | FR-006 – FR-010, FR-029, FR-039 | Catalogue, cart, payment, enrollment |
| **3. Learning & Content Delivery** | FR-011 – FR-013 | Lecture viewing, sequential unlock, progress |
| **4. Assessment & Certification** | FR-020 – FR-023, FR-036 – FR-037 | Exams, grading, certificates |
| **5. Engagement & Feedback** | FR-014 – FR-019, FR-024 – FR-025 | Q&A, reviews, ratings, notifications |
| **6. Content Authoring & Administration** | FR-027 – FR-028.1, FR-030 – FR-035, FR-038 – FR-038.1 | Course authoring, user/platform admin, reporting |

---

## Slide 5 — Requirement Patterns Covered

**Each requirement is written against a reusable Requirement Pattern, so requirements stay consistent and testable. Patterns are grouped by their domain.**

| Pattern | Domain | What it captures | Example |
|---|---|---|---|
| **User registration** | Access Control | A new person creates their own account. | FR-001 |
| **User authentication** | Access Control | Verify a returning user's identity; manage the session. | FR-002, FR-003, FR-004 |
| **Specific authorization** | Access Control | Restrict an action to users holding a specific right. | FR-012, FR-026 |
| **Approval** | Access Control | Route an item through a controlled state change before it goes live. | FR-030 |
| **Living entity** | Data Entity | Create and maintain a business object over its lifetime (CRUD-style). | FR-005, FR-027, FR-036 |
| **Transaction** | Data Entity | Record a discrete business event with its own actor and timestamp. | FR-009, FR-020, FR-039 |
| **Configuration** | Data Entity | Let an authorised user set adjustable system parameters. | FR-029, FR-034 |
| **Chronicle** | Data Entity | Append an immutable audit record for every transaction. | PRV-003 |
| **Inquiry** | User Function | Retrieve and display information without changing state. | FR-006, FR-022, FR-035 |
| **Report** | User Function | Produce an aggregated, formatted view of data over a period. | FR-032, FR-033 |
| **Accessibility** | User Function | Make every screen usable, readable, and easy to navigate. | PRV-004 |
| **Calculation formula** | Information | Derive a value from stored data using a defined formula. | FR-013, FR-019 |
| **Data archiving** | Information | Move an entity out of active use while preserving it for the record. | FR-038, FR-038.1 |
| **Comply-with-standard** | Fundamental | Require conformance to a stated rule or standard. | PRV-002 |
| **Inter-system interaction** | Fundamental | Exchange data with an external system. | PRV-006, FR-008, FR-011, FR-021 |
| **Multi-lingual** | Flexibility | Require content to be available in more than one language. | PRV-005 |
| **Response time** | Performance | Set a measurable speed / throughput threshold. | PR-001 – PR-008 |
| **Fee/tax** | Commercial | Define a monetary fee the system charges for a service. | FR-008 |

---

## Slide 6 — Pattern Domain Coverage

**The Requirement Pattern catalogue has eight domains. The SRS covers every one of them with at least one pattern.**

| # | Domain | Meaning | Covered by |
|---|---|---|---|
| 1 | **Fundamental** | Cross-cutting rules and external-system links. | Comply-with-standard (PRV-002), Inter-system interaction (PRV-006) |
| 2 | **Information** | Derived values and the preserved record of data. | Calculation formula (FR-013, FR-019), Data archiving (FR-038) |
| 3 | **Data Entity** | Defining and maintaining the system's business objects. | Living entity, Transaction, Configuration, Chronicle (PRV-003) |
| 4 | **User Function** | Actions a user performs and information they retrieve. | Inquiry, Report, Accessibility (PRV-004) |
| 5 | **Access Control** | Who may enter the system and what they may do. | User registration, User authentication, Specific authorization, Approval |
| 6 | **Performance** | Measurable speed, throughput, and capacity targets. | §5 Performance Requirements (PR-001 – PR-008) |
| 7 | **Flexibility** | Adapting to more languages, scale, and change. | Multi-lingual (PRV-005) |
| 8 | **Commercial** | Money-related rules — fees and taxes. | Fee/tax (FR-008) |

*Every domain is represented — Fundamental and Flexibility through Pervasive Requirements, Performance through Section 5, and the rest directly in the functional requirements.*

---

## Slide 7 — Pervasive Requirements

**Cross-cutting rules that apply across many FRs, not just one (PRV-001 – PRV-006):**

| Pattern | Domain | Rule |
|---|---|---|
| **User authentication** | Access Control | Most FRs require an active authenticated session. |
| **Comply-with-standard** | Fundamental | Paid content served with no-store caching and a per-user watermark. |
| **Chronicle** | Data Entity | Every transaction appends an immutable audit record (actor, action, timestamp). |
| **Accessibility** | User Function | Every screen has clear navigation, readable text, and sufficient contrast. |
| **Multi-lingual** | Flexibility | User-facing strings served from an English / Arabic catalogue. |
| **Inter-system interaction** | Fundamental | All outbound emails routed through the external Email Service. |

---

## Slide 8 — Traceability Matrix

**Operational Scenarios trace to the FRs they exercise and the NFRs they depend on.**

| Scenario | FRs covered | NFRs / PRs touched |
|---|---|---|
| SC-001 Browse & view course | FR-006, FR-006.1, FR-006.2 | NFR-002, NFR-005, PR-001 |
| SC-002 Register an account | FR-001, FR-002 | NFR-001, NFR-002, NFR-005 |
| SC-003 Enroll via payment | FR-007, FR-008, FR-009 | NFR-001, NFR-002, NFR-005 |
| SC-004 Watch content | FR-011, FR-012, FR-013 | NFR-001, NFR-002, PR-001 |
| SC-005 Take the final exam | FR-020, FR-020.4, FR-021 | NFR-001, NFR-002 |
| SC-006 Complete & review | FR-017, FR-018, FR-019 | NFR-002, NFR-005 |
| SC-007 Ask & browse Q&A | FR-014, FR-015, FR-016 | NFR-001, NFR-002, PR-001 |
| SC-008 Admin creates a course | FR-027, FR-028, FR-029, FR-030, FR-036 | NFR-001, NFR-002, NFR-003, NFR-008 |
| SC-009 Admin monitors reports | FR-026, FR-031, FR-032, FR-033, FR-035 | NFR-001, NFR-002 |

*Takeaway: every scenario maps to concrete FRs, and every FR carries its quality (NFR) and performance (PR) constraints — full forward and backward traceability.*

---

## Slide 9 — Two Non-Obvious Design Choices

**1. Delete only the safe things.**
Hard delete (FR-027.2, FR-036.3) fires only on *Draft, zero-reference* entities. Everything else *archives* (FR-038, FR-039). This protects the audit chronicle and every downstream reference — certificates, enrollments, past exam scores keep working.

**2. Reorder by stating the goal, not the move.**
FR-028.1 takes the *whole new lecture order*, not a "move up/down" delta. Result: idempotent (safe to retry), race-free (parallel admins cannot corrupt each other), and trivially testable.

*Common thread: design the API around the final state the user wants, not the step-by-step actions to get there.*

---

## Slide 10 — Document Coverage

**The SRS is complete across all 12 sections:**

- §1–2 Introduction & General Description
- §3 Functional Requirements (patterns, pervasive, full detail tables)
- §4 Interface Requirements (UI, CLI, API, hardware, communications, software)
- §5 Performance Requirements (PR-001 – PR-008)
- §6 Design Constraints
- §7 Non-Functional Attributes (NFR-001 – NFR-014, each measurable)
- §8 Diagrams — class, use case, 9 sequence diagrams
- §9 Operational Scenarios (SC-001 – SC-009)
- §10 Schedule · §11 Appendices · §12 References

---

## Slide 11 — Closing

**Sonoschool SRS — key strengths**

- Every FR follows a named, reusable **Requirement Pattern** → consistency.
- Requirements organised by **domain** and grouped into **6 functional modules** → clarity.
- **Full traceability**: scenario → FR → NFR/PR.
- Quality attributes are **measurable and verifiable** (NFR-001 – NFR-014).
- Design decisions are deliberate and defensible.
