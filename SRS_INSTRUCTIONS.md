# SRS Instructions — How to Fill in `SRS.md`

This document tells the team **how** to fill the SRS template (`SRS.md`) and **what** every section expects. It also explains the **quality rules**, **writing conventions**, and **Requirement Pattern** approach that every Functional Requirement must follow.

---

## Table of Contents

1. [General Rules](#1-general-rules)  
2. [Identifier Conventions](#2-identifier-conventions)  
3. [Section-by-Section Instructions](#3-section-by-section-instructions)  
4. [Requirement Quality Checklist](#4-requirement-quality-checklist)  
5. [Functional vs. Non-Functional Requirements](#5-functional-vs-non-functional-requirements)  
6. [Requirement Patterns — Full Guide](#6-requirement-patterns--full-guide)  
7. [How a Functional Requirement Must Be Written](#7-how-a-functional-requirement-must-be-written)  
8. [Requirements Management Rules](#8-requirements-management-rules)  
9. [Traceability Rules](#9-traceability-rules)  
10. [Prioritization Rules](#10-prioritization-rules)  
11. [Definition of Done (per section)](#11-definition-of-done-per-section)  
12. [Review Checklist](#12-review-checklist)

---

## 1\. General Rules

- **Do not** rename section headings or change the table column structure — they match the rubric.  
- Fill **every** cell. If a cell does not apply, write `N/A` (never leave it blank, never delete the row).  
- Write in **third person, present tense**, using `shall` for mandatory requirements — e.g. *"The system shall ..."*.  
- Each requirement must be **atomic** — one requirement \= one testable statement. If you find yourself writing "and", split it into two requirements.  
- Use **absolute dates** (e.g. `16-05-2026`), never relative terms like "next week".  
- **Date format note.** Every date field in the document uses **`DD-MM-YYYY`** (day, month, year), zero-padded — e.g. `09-03-2026`, not `9/3/26` or `2026-03-09`. The fields that follow this rule are:
  - *Document Control* → **Date of issue**
  - *Revision History* → **Date** column
  - *Functional Requirement table* → **Version history** entries
  - *Preliminary Schedule* → **Start** and **End** columns
  - Every `Deprecated` log entry, every `TBD` resolution deadline, every meeting/interview date cited as a source.  
- All numeric thresholds must have **units** (ms, MB, users, %, req/s).  
- Cross-reference other items using their ID (e.g. *"depends on FR-003"*).  
- Use `TBD` — never a blank — when information is not yet known. Assign an owner and a resolution deadline next to every `TBD`.  
- Update the **Version History** cell whenever a requirement changes.  
- Commit changes on your own branch and open a PR — do not push directly to `main`.

---

## 2\. Identifier Conventions

Use these prefixes consistently — every item must have a unique ID.

| Prefix | Used For | Example |
| :---- | :---- | :---- |
| `FR-###` | Functional Requirement | FR-001, FR-002, ... |
| `NFR-###` | Non-Functional Requirement | NFR-001, NFR-002, ... |
| `PR-###` | Performance Requirement | PR-001, PR-002, ... |
| `UI-###` | UI Screen / Mock-up | UI-001, UI-002, ... |
| `C-###` | Class (OO Domain Analysis) | C-001, C-002, ... |
| `SC-###` | Operational Scenario | SC-001, SC-002, ... |
| `T-###` | Schedule Task | T-001, T-002, ... |

IDs are **frozen once assigned** — if a requirement is removed, do **not** reuse its ID; mark it as *deprecated* in the Version History.

Follow-on requirements (sub-requirements that expand a parent FR) use the parent ID with a decimal suffix: `FR-###.1`, `FR-###.2`, ...

---

## 3\. Section-by-Section Instructions

### Section 1 — Introduction

- **1.1 Purpose**: Who this document is for (team, supervisor, examiner) and what it achieves.  
- **1.2 Scope**: What is *in* scope and what is *out* of scope. Name the elicitation team (analysts, users, developers) and any constraints (time, budget, tools).  
- **1.3 Overview**: 1 short paragraph — what the product is, in plain language.  
- **1.4 Business Context**: The organization sponsoring the project, its mission, its goals, and the problem it is trying to solve.

### Section 2 — General Description

- **2.1 Product Functions**: Bullet list — the top 5–10 things the product does (high-level only).  
- **2.2 Similar System Information**: Is it stand-alone? Does it integrate with existing software? Name comparable systems.  
- **2.3 User Characteristics**: Fill the table. One row per user type (e.g. Student, Instructor, Admin). Include technical background and skill level.  
- **2.4 User Problem Statement**: The pain point being solved, stated as the user feels it.  
- **2.5 User Objectives**: What the user wants to achieve — include a "wish list" if you have one.  
- **2.6 General Constraints**: Speed requirements, network protocols, target platform, budget caps, regulatory compliance, etc.

### Section 3 — Functional Requirements

**This is the biggest section. Read [§6 Requirement Patterns](#6-requirement-patterns--full-guide) and [§7 How a Functional Requirement Must Be Written](#7-how-a-functional-requirement-must-be-written) before filling it in.**

- Keep the **Summary Table** at the top up-to-date — it is the index for the whole section.  
- Fill **one FR block per requirement** (FR-001, FR-002, ...).  
- **Every** FR must declare which Requirement Pattern was used (see §6).  
- Pervasive requirements (system-wide rules that apply to all FRs of a given type) go in §3.3, **before** the individual FR blocks they govern.  
- The "Priority" column uses one of three labels: `High` / `Moderate` / `Low`.

### Section 4 — Interface Requirements

- **4.1.1 GUI**: One row per screen in the table. Attach mock-ups in `/docs/mockups/` and reference them by filename.  
- **4.1.2 CLI**: Only if the system exposes a command line. Otherwise `N/A`.  
- **4.1.3 API**: Public functions/endpoints. Use exact names, parameter types, and a sample invocation.  
- **4.1.4 Diagnostics**: How to read logs and obtain debug information.  
- **4.2 Hardware**: Any devices the system interfaces with (sensors, printers, etc.). `N/A` if none.  
- **4.3 Communications**: Network protocols (HTTPS, WebSocket, SMTP, ...).  
- **4.4 Software**: External libraries and third-party services (Stripe, SendGrid, Firebase, ...).

### Section 5 — Performance Requirements

- Every entry needs a **measurable threshold** — e.g. *"Page load ≤ 2 s at p95 under 100 concurrent users"*.  
- Cover at minimum: response time, throughput, capacity, and memory footprint.  
- Link each PR-\#\#\# back to the FR(s) it constrains.

### Section 6 — Design Constraints

- **6.1 Standards Compliance**: ISO, OWASP, WCAG, PCI-DSS, HIPAA, or any other applicable standard.  
- **6.2 Hardware Limitations**: Minimum RAM, supported OS versions, screen size targets.  
- **6.3 Others**: Anything else — legal, licensing, deployment environment, tool mandates.

### Section 7 — Non-Functional Attributes

- Fill **every** subsection (7.1 – 7.11) — even if short. A missing subsection scores zero.  
- The Summary Table (NFR-001 → NFR-011) must stay in sync with the prose subsections.  
- Every NFR must be **measurable** wherever possible (see §5 for guidance on each NFR type).

### Section 8 — OO Domain Analysis

- **8.1**: Draw the inheritance hierarchy. Save the diagram as `/docs/diagrams/class-diagram.png` and embed it.  
- **8.2**: One block per class. Use `C-001`, `C-002`, ...  
  - Mark every class as **Abstract** or **Concrete**.  
  - **Superclasses / Subclasses**: write `N/A` if none.  
  - **Collaborations**: list other classes this one communicates with and how.  
  - **Attributes / Operations**: use exact types (`string`, `int`, `List<User>`, etc.).  
  - **Constraints**: state any invariants (e.g. *"`balance` must be ≥ 0"*).

### Section 9 — Operational Scenarios

- One block per scenario (`SC-001`, `SC-002`, ...).  
- Use the **Action Table** format: each row \= one step, actor, and action.  
- Always include a Pre-Condition, Post-Condition, and Trigger.  
- Cover the **happy path** (main flow) and at least 1–2 **alternative flows** \+ **exception flows**.  
- Link each scenario back to the FR(s) it exercises in the `Related Requirements` row.

### Section 10 — Preliminary Schedule

- One row per task. Use absolute dates (`DD-MM-YYYY`).  
- Embed the Gantt/PERT chart image (export from MS Project, GanttProject, or draw.io).  
- Identify which tasks are on the critical path.

### Section 11 — Preliminary Budget

- Itemize by cost factor: labor, hosting, licenses, hardware, contingency.  
- Keep currency consistent across the entire table.

### Section 12 — Appendices

- **12.1 Definitions / Acronyms**: every domain term and abbreviation used in the document.  
- **12.2 Collected Material**: interview notes, survey results, references to external documents.

### Section 13 — References

- Use IEEE-style citations.  
- Number them `[1]`, `[2]`, ... and cite them inline by number.

---

## 4\. Requirement Quality Checklist

Before marking any requirement as complete, verify all of the following. These come directly from IEEE Std 830-1998.

| Quality Attribute | What to Check |
| :---- | :---- |
| **Complete** | Nothing is left to the reader's imagination. Any unknown detail is flagged `TBD` with an owner. |
| **Consistent** | It does not contradict any other requirement. Terminology matches the glossary (§12.1). |
| **Correct** | It is logically sound, technically achievable, and legally compliant. |
| **Unambiguous** | It has exactly one possible interpretation. No vague adverbs (`quickly`, `appropriately`), no dangling `etc.` |
| **Verifiable** | A tester can prove it is satisfied by inspection, test, demonstration, or analysis. If you cannot write a test for it, rewrite it. |
| **Feasible** | The team can implement it within cost, schedule, and technical constraints. |
| **Relevant** | It falls within the agreed scope boundary. |
| **Traceable** | Its origin (stakeholder, interview, regulation) is recorded. Its ID is used consistently downstream. |
| **Modifiable** | A change to it does not require editing every other requirement. |
| **Prioritized** | It carries a `High` / `Moderate` / `Low` label — it is not simply "nice to have". |
| **Atomic** | It expresses one — and only one — testable capability. |
| **Current** | If requirements changed after an earlier draft, this entry was updated to match. |

### Common Writing Pitfalls — Avoid These

| Pitfall | Danger Signs | Fix |
| :---- | :---- | :---- |
| **Over-specification (What vs. How)** | Names of components, database fields, class names, software objects inside a user/system requirement | Describe *what* the system does, not *how* it does it |
| **Escape clauses** | `if`, `but`, `unless`, `except`, `although` | Fully specify every conditional branch |
| **Vague indefinable terms** | `user-friendly`, `flexible`, `to the maximum extent`, `minimal impact` | Replace with a measurable criterion |
| **Compound requirements** | `and`, `or`, `also`, `with` joining two obligations | Split into two separate requirements |
| **Speculation / wish-list** | `usually`, `generally`, `often`, `may`, `might`, `perhaps`, `probably` | Remove or commit to a `shall` |
| **Wishful thinking** | `100% reliable`, `handle all failures`, `fully upgradeable` | Replace with a realistic, testable target |
| **Ambiguous boundaries** | "up to 5 days" (does 5 count?) | Use `5 or fewer days` / `more than 5 days` |
| **Missing exceptions** | Happy path described with no error/failure handling | Add a companion requirement for each exception |
| **Mixing levels** | User requirement mixed with database schema or subsystem detail | Keep each requirement at one level of abstraction |

---

## 5\. Functional vs. Non-Functional Requirements

### 5.1 Functional Requirements (FRs)

Describe **what the system shall do** — specific behaviors, operations, and capabilities. FRs can typically be traced to individual components or modules. Write them using a Requirement Pattern (see §6).

### 5.2 Non-Functional Requirements (NFRs)

Define **constraints and quality attributes** of the system — the *"ilities."* NFRs typically cross-cut the entire architecture and cannot be satisfied by a single module.

Every NFR **must be expressed as a measurable statement** with a defined target, scale, and condition. An NFR that cannot be measured cannot be tested and is invalid.

| NFR Type | What It Governs | Example Measurable Requirement |
| :---- | :---- | :---- |
| **Performance** | Response time, throughput, capacity | *"The system shall process 100 payment transactions per second under peak load."* |
| **Reliability** | Failure rate, recovery, precision | *"The system defect rate shall be fewer than 1 failure per 1,000 hours of operation."* |
| **Availability** | Uptime, MTBF, MTTR | *"The system shall achieve ≥ 99.99% uptime, equating to ≤ 52 minutes of downtime per year."* |
| **Security** | Resistance to attack, detection time | *"At least 99% of intrusion attempts shall be detected within 10 seconds."* |
| **Usability** | Learnability, efficiency, error rate | *"4 out of 5 first-time users shall complete task X in under 5 minutes without prior training."* |
| **Maintainability** | Time to fix or extend, code complexity | *"The cyclomatic complexity of any module shall not exceed 7."* |
| **Testability** | Test coverage, environment setup time | *"The delivered system shall include unit tests achieving 100% branch coverage."* |
| **Portability** | Platform compatibility, migration time | *"No more than 5% of the implementation shall be platform-specific."* |
| **Scalability / Robustness** | Behavior under extreme load or failure | *"The system shall serve up to 10,000 concurrent users while satisfying all functional requirements."* |
| **Reusability / Integrability** | Component reuse, integration effort | *"The payment module shall be implemented as a self-contained component, reusable by other teams."* |
| **Access Security** | Authentication, authorization | *"Users shall be required to change their password on next login if it has not been changed within the configured expiration period."* |

### 5.3 Availability Formula

When writing Availability NFRs, you may derive the target from:

Availability \= MTBF / (MTBF \+ MTTR)

Where `MTBF` \= Mean Time Between Failures and `MTTR` \= Mean Time to Repair. Typical targets and their implied downtime:

| Target | Max Downtime / Year |
| :---- | :---- |
| 99% | 3.65 days |
| 99.9% | 8.76 hours |
| 99.99% | 52 minutes |
| 99.999% | 5 minutes |

---

## 6\. Requirement Patterns — Full Guide

**Why we use them:** A Requirement Pattern is a **template \+ guide** for writing a specific type of requirement (report, inquiry, user authentication, performance, etc.). Patterns make requirements easier to write, easier to compare, easier to test, and easier to spot when something is missing. Every FR in `SRS.md` must declare the pattern it uses.

### 6.1 What a Requirement Pattern Contains

Every pattern (the *recipe*, not the requirement itself) tells you:

1. **When to use** the pattern (and when not to).  
2. **How to write** a requirement based on it.  
3. **How to implement** it — hints for developers.  
4. **How to test** it — hints for testers.

### 6.2 Anatomy of a Pattern Definition

| Section | What It Contains |
| :---- | :---- |
| **Pattern Name** | Unique name (e.g. *Report*, *Inquiry*, *User Authentication*). |
| **Basic Details** | Owning domain, related patterns, anticipated frequency of use, classifications, pattern author. |
| **Applicability** | The situations where the pattern applies — and where it does **not**. |
| **Discussion** | How to write a requirement of this type; pitfalls to watch for. |
| **Content** | Numbered list of items the requirement must convey (each marked Optional or Mandatory). |
| **Template(s)** | Fill-in-the-blanks starter sentence — copy and substitute the placeholders. |
| **Example(s)** | Realistic example requirements written with the pattern. |
| **Extra Requirements** | Follow-on requirements that expand the original; Pervasive requirements that apply to all instances of the pattern. |
| **Considerations for Development** | Implementation hints, written in the language of developers. |
| **Considerations for Testing** | Testing hints, written in the language of testers. |

### 6.3 Pattern Domains (where to look for the right pattern)

Patterns are grouped into **domains** — pick the domain that matches the nature of the requirement, then pick the specific pattern inside it.

| Domain | Patterns Inside |
| :---- | :---- |
| **Fundamental** | Technology, Comply-with-standard, Refer-to-requirements, Documentation, Inter-system interface, Inter-system interaction |
| **Information** | Data type, ID, Data structure, Calculation formula, Data archiving, Data longevity |
| **Data Entity** | Living entity, Transaction, Configuration, Chronicle |
| **User Function** | Inquiry, Report, Accessibility |
| **Performance** | Response time, Throughput, Dynamic capacity, Static capacity, Availability |
| **Flexibility** | Scalability, Extendability, Installability, Un-parochialness, Multi-lingual |
| **Access Control** | User registration, User authentication, User authorization, Specific authorization, Configurable authorization, Approval |
| **Commercial** | Fee/tax, Multi-organization unit |

### 6.4 Pattern Relationships

- **Refers to** — a pattern mentions another pattern in its definition.  
- **Extends** — a pattern specializes another pattern (e.g. *Specific authorization* extends *User authorization*).

When a pattern extends another, the child inherits all of the parent's Content items. Add only what is new.

### 6.5 Pattern Classifications

Each pattern is classified along these axes. When you choose a pattern, your FR inherits these labels:

| Axis | Values |
| :---- | :---- |
| **Functional** | Yes / Maybe / No |
| **Pervasive** | Yes / Maybe / No |
| **Affects Database** | Yes / Maybe / No |

Record the inherited classification in the **Pattern Classification** field of the FR block (see §7.2).

### 6.6 Extra Requirements

- **Follow-on requirements** — live *immediately after* the parent FR and expand it. IDs: `FR-###.1`, `FR-###.2`, ...  
- **Pervasive requirements** — written **once** and apply to every FR of that pattern type. Place them at the top of the relevant subsection in §3.3, before the individual FR blocks.  
  - Example: *"Every report page shall display the company logo."*  
  - Example: *"All data shall be accessible on at least one inquiry or report."*

---

## 7\. How a Functional Requirement Must Be Written

Each FR block in `SRS.md` is the **Requirement Pattern form filled in**. Fill each sub-block in order — earlier ones drive the later ones.

### 7.1 Sub-block: Catalogue

Identifies the requirement. Fill once; do not change the ID afterwards.

| Field | How to Fill |
| :---- | :---- |
| **Identifier** | Already assigned (`FR-001`, ...). Frozen — do not change. |
| **Name** | Short imperative phrase — e.g. *"Register New User"*, *"Generate Monthly Sales Report"*. |
| **Type** | `Functional`. |
| **Priority** | One of `High` / `Moderate` / `Low`. See §10 for the meaning of each label. |
| **Source** | Who or what originated this requirement (interview, survey, regulation, supervisor). |
| **Owner** | The stakeholder who signs it off and can approve changes. |
| **Author** | The teammate who wrote this entry. |
| **Business Area** | The part of the system this belongs to — e.g. *Enrollment*, *Payments*, *Reporting*. |
| **Stakeholders** | Roles that have an interest in this requirement being satisfied. |

### 7.2 Sub-block: Pattern Application

Records which Requirement Pattern you applied and why it fits.

| Field | How to Fill |
| :---- | :---- |
| **Pattern Used** | Exact pattern name from §6.3 — e.g. *Inquiry*, *Report*, *User Authentication*. **Mandatory.** |
| **Pattern Domain** | The domain the pattern lives in — e.g. *User Function*, *Access Control*. |
| **Related Patterns** | Other patterns this one refers to or extends. |
| **Pattern Classification** | Inherited from the pattern: Functional Yes/Maybe/No, Pervasive Yes/Maybe/No, Affects DB Yes/Maybe/No. |
| **Applicability** | One sentence: why this pattern fits this specific requirement. Without this, the choice cannot be justified. |

### 7.3 Sub-block: Description

Use the pattern's **Template** as the starter sentence and substitute the placeholders. The requirement must remain **atomic** and **testable** — expand only as needed.

**Language rules:**

- Subject: the **system** (not a user role).  
- Verb: always `shall` for mandatory behavior; `may` for optional.  
- Include a **measurable success criterion** where the pattern calls for one.  
- Active voice. Present tense. One sentence per requirement.

**Example for the *Report* pattern:**

*"There shall be a `Monthly Revenue Report` that lists total revenue grouped by product category for the selected calendar month. The report shall be generated within 10 seconds for data sets covering up to 12 months."*

### 7.4 Sub-block: Content Items

Copy the pattern's Content list into the table and fill the **Value** column. Mark **Optional?** as `Yes` / `No` per the pattern definition.

| \# | Content Item | Optional? | Value |
| :---- | :---- | :---- | :---- |
| 1 | (from pattern) | Yes / No | (your value) |
| 2 | ... | ... | ... |

### 7.5 Sub-block: Pre / Post Conditions

| Field | How to Fill |
| :---- | :---- |
| **Pre-Condition** | The system state required before the function can execute. |
| **Post-Condition** | The system state guaranteed after the function completes successfully. |

### 7.6 Sub-block: Risks & Constraints

| Field | How to Fill |
| :---- | :---- |
| **Criticality** | How essential this is — relate to the `High` / `Moderate` / `Low` priority. |
| **Technical Issues** | Design or implementation concerns to flag early. |
| **Cost & Schedule** | Relative or absolute implementation cost or schedule impact. |
| **Risks** | What could prevent satisfying this requirement; proposed mitigation. |
| **Dependencies** | Other FR-\#\#\# / NFR-\#\#\# / PR-\#\#\# IDs this requirement depends on. |

### 7.7 Sub-block: Associated & Related

| Field | How to Fill |
| :---- | :---- |
| **Associated NFRs** | NFR-\#\#\# IDs tied to this FR (security, performance, availability constraints). |
| **Related Requirements** | Other FR-\#\#\# IDs related but not depended on. |
| **Related Documents** | External documents, diagrams, mock-ups, and regulations. |

### 7.8 Sub-block: Acceptance Criteria

Bullet list of conditions a tester checks to confirm the requirement is satisfied. **Each must be measurable.** Use `[ ]` checkboxes — they are ticked off during testing.

- `[ ]` Criterion 1 — specific and measurable.  
- `[ ]` Criterion 2 — specific and measurable.  
- `[ ]` ...

### 7.9 Sub-block: Follow-on Requirements

Sub-requirements that **expand** the original requirement. Live immediately after the parent FR. IDs: `FR-###.1`, `FR-###.2`, ...

Pervasive requirements (system-wide rules that apply to all instances of the pattern) are **not** placed here — they go in §3.3.

### 7.10 Sub-block: Considerations for Development

Hints for implementers — drawn from the pattern's *Considerations for Development* section, then tailored to this specific requirement. Written in the language of developers (data structures, algorithms, frameworks, edge cases).

### 7.11 Sub-block: Considerations for Testing

Hints for testers — drawn from the pattern's *Considerations for Testing* section, then tailored. Bridge the Acceptance Criteria with the planned test approach (unit, integration, UAT, performance, security).

### 7.12 Sub-block: Comments / Version History

One row per revision: `vX.Y — DD-MM-YYYY — author — change description`

### Worked Example (do **not** copy verbatim — adapt to your FR)

**FR-00X — View Enrolled Courses**

- **Pattern Used:** Inquiry  
- **Pattern Domain:** User Function  
- **Applicability:** This is an inquiry because it retrieves and displays existing data without modifying system state.  
- **Description:** *"There shall be a `My Courses` inquiry that displays the list of courses in which the currently authenticated student is enrolled. For each course, the inquiry shall show: course title, instructor name, progress percentage, and next due item."*  
- **Pre-Condition:** Student is authenticated and has at least one active enrollment.  
- **Post-Condition:** The list is displayed; no system state is changed.  
- **Acceptance Criteria:**  
  - `[ ]` The list contains every course with an active enrollment for the logged-in student.  
  - `[ ]` Courses are sorted by most-recently-accessed date, descending.  
  - `[ ]` The page loads in ≤ 2 s at p95 under normal load (links to PR-001).  
  - `[ ]` A student with zero enrollments sees an appropriate empty-state message.

---

## 8\. Requirements Management Rules

Requirements are not static. The team must follow these rules whenever a requirement changes.

### 8.1 When Requirements Change

Changes are expected and legitimate. Common causes include:

- Errors or conflicts discovered during analysis or implementation.  
- Evolving stakeholder understanding of what is actually needed.  
- Technical, schedule, or budget constraints that force trade-offs.  
- New regulations, competitor actions, or organizational changes.

### 8.2 Change Process

1. **Propose** the change with a written rationale in the PR description.  
2. **Assess impact** — which other FRs, NFRs, classes, scenarios, and test cases are affected? List them.  
3. **Get approval** from the requirement Owner before merging.  
4. **Update** all affected artefacts in the same PR — never leave dangling references.  
5. **Log** the change in the Version History cell of every updated requirement.

### 8.3 Deprecated Requirements

If a requirement is removed, set its status to `Deprecated` in the Summary Table. **Do not delete** the FR block and **do not reuse** its ID. Log the deprecation with date and reason in its Version History.

### 8.4 Stability Labels

Flag each requirement with its expected stability so the team can manage volatility:

| Label | Meaning |
| :---- | :---- |
| `Stable` | Grounded in the core business domain; unlikely to change. |
| `Volatile` | Tied to a specific environment, policy, or technology; expected to change. |

Types of volatile requirements to watch for: **Mutable** (environment changes), **Emergent** (cannot be fully known until the system is built), **Consequential** (based on assumptions about usage), **Compatibility** (dependent on external systems or technology).

---

## 9\. Traceability Rules

Every requirement must be traceable. Traceability is what allows the team to assess the impact of a change, verify that every requirement has been implemented and tested, and avoid losing knowledge when team members rotate.

### 9.1 Backward Traceability (to origin)

Every requirement must explicitly reference its source in the **Source** field of the Catalogue sub-block:

- Stakeholder name and interview/meeting date, OR  
- Document name and section, OR  
- Regulation or standard reference.

### 9.2 Forward Traceability (to downstream artefacts)

Every requirement ID must appear in at least one of the following:

| Artefact | How the ID appears |
| :---- | :---- |
| Operational Scenario (`SC-###`) | `Related Requirements` row |
| Class (`C-###`) | Collaborations or constraints mentioning the FR |
| Test case | Acceptance Criteria checklist or external test document |
| NFR (`NFR-###`) | `Associated NFRs` field of the parent FR |

### 9.3 Traceability Representations

For the SRS document, traceability is recorded in two places:

| Format | Where in SRS.md |
| :---- | :---- |
| **Requirements Catalogue** | Each FR block carries its Source, Associated NFRs, Related Requirements, and Related Documents fields. |
| **Traceability Matrix** | A separate matrix section (or spreadsheet) mapping FR-\#\#\# × SC-\#\#\#, FR-\#\#\# × C-\#\#\#, and FR-\#\#\# × NFR-\#\#\# |

A requirement with no forward link to a scenario or test is incomplete — it either needs a scenario or the scenario needs to be added.

---

## 10\. Prioritization Rules

The team must prioritize requirements before committing them to a sprint or release plan.

### 10.1 Priority Levels

Assign every requirement one of the following. The label goes in the **Priority** field of the Catalogue sub-block.

| Label | Meaning | Test Question |
| :---- | :---- | :---- |
| `High` | Non-negotiable. The project fails without it. Implemented in the first release. | *Can we ship without this? → No* |
| `Moderate` | Important, but a workaround exists. Will not cause project failure if deferred slightly. | *Can this wait one sprint? → Yes* |
| `Low` | Desired, but low adverse effect if cut under time pressure or deferred to a later release. | *Can we sacrifice this before the deadline? → Yes* |

### 10.2 Priority Aspects to Consider

When assigning priority, consider all of the following aspects. Document the rationale in the **Risks & Constraints** sub-block.

| Aspect | Question to Answer |
| :---- | :---- |
| **Importance** | What is the business or user value of this requirement? |
| **Penalty** | What is the cost of *not* delivering it? |
| **Implementation Cost** | How much effort does it take? |
| **Risk** | How technically uncertain is it? |
| **Volatility** | How likely is it to change before delivery? |

---

## 11\. Definition of Done (per section)

A section is **done** when **all** of the following are true:

- [ ] Every cell is filled — no blanks; `N/A` or `TBD` (with owner) where appropriate.  
- [ ] Every ID is unique and follows the conventions in §2.  
- [ ] Every FR declares a Requirement Pattern (Pattern Used field filled).  
- [ ] Every requirement is atomic and testable.  
- [ ] All numeric values have units.  
- [ ] All cross-references resolve — no dangling FR-\#\#\# / NFR-\#\#\# / C-\#\#\# IDs.  
- [ ] Diagrams referenced in the document exist in `/docs/`.  
- [ ] Version History is updated with the latest change.  
- [ ] Section reviewed by a second teammate (initials in the PR description).

---

## 12\. Review Checklist

Before opening a PR that touches `SRS.md`, run this checklist:

- [ ] No section heading was renamed or removed.  
- [ ] Table column counts match the template.  
- [ ] All new IDs are unique across the whole document.  
- [ ] Each FR has a **Pattern Used**, a **Description**, and **Acceptance Criteria**.  
- [ ] Every Acceptance Criterion is measurable.  
- [ ] All scenarios (`SC-###`) link back to at least one FR.  
- [ ] All classes (`C-###`) appear in the inheritance diagram.  
- [ ] NFR Summary Table matches subsections 7.1–7.11.  
- [ ] No requirement uses vague language (`user-friendly`, `fast`, `reliable`, `etc.`).  
- [ ] No requirement mixes a `shall` statement with a `how` implementation detail.  
- [ ] Every `TBD` has an assigned owner and a target resolution date.  
- [ ] Stability labels are set on all volatile requirements.  
- [ ] Spell-checked and Markdown-formatted (run a linter if available).

---

**Questions or unclear cells?** Add a `> TODO @teammate-name: question` line directly under the row in question, and raise it in the next team sync.  
