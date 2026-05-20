# Software Requirements Specification

## Sonoschool

## Document Control

| Field | Value |
| --- | --- |
| Document version | V1.0 |
| Status | Draft |
| Authors | Mohamed Hany |
| Supervisor | Dr. Mohamed Labib |
| Faculty / University | MSA - Modern Sciences and Arts University |
| Date of issue | 16-05-2026 |

### Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
|   V1.0 | 16-05-2026 | Mohamed Hany | Document Initial Version |
|  |  |  |  |

## 1. Introduction

### 1.1 Purpose of this Document

The purpose of this document is to present a detailed description of **Sonoschool**, a web-based academic medical learning platform. It will explain the features of the system, the interfaces through which users interact with it, what the system will do, the constraints under which it must operate, and how the system will react to external inputs. This document is intended for both the **developers** responsible for building the system and the **stakeholders** who have a direct interest in its outcome.


### 1.2 Scope

#### In Scope

The following capabilities fall within the boundary of this project:

- **User management** — registration, login, profile management, and role-based access for two user types: Student, and Administrator.
- **Course catalogue** — browsing, searching, filtering, and sorting of available courses.
- **Enrollment and payments** — course enrollment with integrated payment processing (checkout, order history).
- **Content delivery** — structured course pages presenting video lectures, written material, and downloadable resources.
- **Progress tracking** — per-student tracking of lesson completion and overall course progress.
- **Completion certificates** — Administrators upload completion certificates for students; students can view and download their certificates once the Administrator has uploaded them.
- **Admin dashboard** — content moderation, user management, and basic reporting for platform administrators.

#### Out of Scope

The following are explicitly excluded from this release:

- Native mobile applications (iOS / Android) — the platform is web-only.
- Live-streaming or real-time video conferencing between instructors and students.
- Multi-language (i18n) support beyond English.
- Offline content access or downloadable course packages.
- Advanced analytics dashboards or business-intelligence reporting.


### 1.3 Overview

Sonoschool is a web-based platform that allows students to browse, enroll in, and follow online courses, while administrators manage content, users, and completion certificates. The rest of this document is organized as follows: Section 2 gives a general description of the product, its functions, and its users. Section 3 covers the functional requirements in detail. Section 4 describes the system's interfaces. Sections 5 and 6 address performance requirements and design constraints. Section 7 lists non-functional attributes. Sections 8 through 10 present system diagrams, operational scenarios, and the project schedule. Sections 11 through 13 cover the budget, appendices, and references.

### 1.4 Business Context

Sonoschool is an academic medical learning platform aimed at healthcare professionals and medical students who need access to structured, field-specific courses online. The organization behind Sonoschool recognized that medical learners lack a dedicated platform that combines course access, progress tracking, and certified completion in one place. Sonoschool was built to address that need by offering a focused, easy-to-use environment for continuous medical education.

#### 1.4.1 Mission Statement

The mission of Sonoschool is to provide a secure, accessible, and user-friendly platform for delivering academic medical education online — enabling healthcare professionals and students to enroll in courses, track their learning progress, and obtain verified completion certificates with ease.

#### 1.4.2 Organizational Objectives

1. Provide medical learners with a clear and organized platform to browse, enroll in, and complete relevant healthcare courses.
2. Enable students to monitor their learning progress and receive completion certificates uploaded by platform administrators.
3. Give administrators full control over course content, user management, and certification to maintain the quality and credibility of the platform.

## 2. General Description

### 2.1 Product Functions

1. **User Registration and Login** — Users can create an account and securely log in to access the platform.
2. **Course Browsing, Filtering, and Sorting** — Students can explore the course catalogue and filter or sort results by category, price, or other criteria.
3. **Course Enrollment and Payment** — Students can enroll in a course by completing a secure payment process.
4. **Content Delivery** — Enrolled students can access course materials including video lectures and supporting resources.
5. **Progress Tracking** — The system tracks each student's completion status across course lessons and displays their overall progress.
6. **Completion Certificates** — Once a student completes a course, administrators can upload a certificate which the student can then view and download.
7. **Admin Dashboard** — Administrators can manage users, courses, and certificates through a dedicated control panel.

### 2.2 Similar System Information

Sonoschool is a stand-alone web application. It does not replace or integrate with any existing learning management system. The only external integration is a third-party payment gateway used to process course enrollment payments.

Several platforms offer comparable functionality and serve as a reference point for Sonoschool's design:

- **Udemy** — a general-purpose online learning marketplace where instructors publish courses and students enroll and track progress. Sonoschool follows a similar enrollment and content structure but is focused exclusively on medical education.
- **Coursera** — an academic online learning platform offering courses from universities and institutions. Like Sonoschool, it supports structured course content and issues completion certificates.
- **Lecturio** — a medical-specific e-learning platform targeting healthcare students and professionals, making it the closest comparable system to Sonoschool in terms of target audience and content domain.

Unlike these platforms, Sonoschool is a focused, lightweight solution where certificates are managed and uploaded directly by administrators rather than being automatically generated.

### 2.3 User Characteristics

| User type | Expected expertise | Domain knowledge |
| --- | --- | --- |
| **Student** | Basic computer literacy; comfortable browsing the web and using online forms | Medical background; seeking to expand knowledge through structured online courses |
| **Administrator** | Moderate technical proficiency; able to manage a web-based dashboard and handle file uploads | Familiar with platform operations; responsible for publishing courses, managing users, and issuing certificates |

### 2.4 User Problem Statement

**Students** in the medical field often find it difficult to access well-structured, reliable courses online. Resources are scattered across different websites, there is no consistent way to track how far they have progressed, and completing a course rarely results in any formal proof of achievement. This makes it hard for medical learners to manage their own education or demonstrate their professional development.

**Administrators** face the challenge of managing course content, user accounts, and certificates without a centralized tool. Without a dedicated platform, these tasks become time-consuming and error-prone.

Sonoschool addresses both problems by bringing course access, progress tracking, and certificate management together in one organized, easy-to-use platform.

### 2.5 User Objectives

**Students:**
1. Find and enroll in relevant medical courses quickly and without difficulty.
2. Follow course content in a structured, self-paced manner and keep track of their progress.
3. Obtain a completion certificate as proof of their learning once they finish a course.

**Administrators:**
1. Publish and manage course content through a simple, centralized dashboard.
2. Oversee user accounts and control access to the platform.
3. Upload and manage completion certificates for students who have finished their courses.

**Wish list (desirable but not guaranteed in this release):**
- Students would like to receive email notifications when their certificate is ready to download.
- Administrators would like a reporting view showing enrollment numbers and completion rates per course.

### 2.6 General Constraints

1. The system must run on standard web browsers (Chrome, Firefox, Edge, Safari) without requiring any software installation on the user's device.
2. All communication between the client and the server must be transmitted over HTTPS to ensure data security.
3. The system must be implemented using the agreed technology stack — React / Next.js for the front-end and Node.js for the back-end — and must not depend on proprietary or paid enterprise tools.
4. Payment processing must be handled through a third-party payment gateway and must not store sensitive card details on the platform's own servers.
5. The platform is web-only; no native mobile application will be developed in this release.

## 3. Functional Requirements

This section specifies the functional requirements of the system. Each requirement is expressed using a Requirement Pattern; every FR appears below as a single table grouping the catalogue fields, pattern application, pre/post conditions, risks, acceptance criteria, follow-on requirements, and considerations for development and testing.

### 3.1 Summary

| Identifier | Name | Priority | Pattern | Domain |
| --- | --- | --- | --- | --- |
| FR-001 |  |  |  |  |
| FR-002 |  |  |  |  |
| FR-003 |  |  |  |  |
| FR-004 |  |  |  |  |
| FR-005 |  |  |  |  |
| FR-006 |  |  |  |  |
| FR-007 |  |  |  |  |
| FR-008 |  |  |  |  |
| FR-009 |  |  |  |  |
| FR-010 |  |  |  |  |

### 3.2 Pattern Catalogue

| Pattern ID | Pattern name | Domain | Refers to | Extends | Classification |
| --- | --- | --- | --- | --- | --- |
| P-01 |  |  |  |  |  |
| P-02 |  |  |  |  |  |
| P-03 |  |  |  |  |  |
| P-04 |  |  |  |  |  |
| P-05 |  |  |  |  |  |

### 3.3 Pervasive Requirements

| Identifier | Pattern | Statement |
| --- | --- | --- |
| PRV-001 |  |  |
| PRV-002 |  |  |
| PRV-003 |  |  |

### 3.4 Requirement Details

#### FR-001

| Field | Value |
| --- | --- |
| Identifier | FR-001 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-002

| Field | Value |
| --- | --- |
| Identifier | FR-002 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-003

| Field | Value |
| --- | --- |
| Identifier | FR-003 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-004

| Field | Value |
| --- | --- |
| Identifier | FR-004 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-005

| Field | Value |
| --- | --- |
| Identifier | FR-005 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-006

| Field | Value |
| --- | --- |
| Identifier | FR-006 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-007

| Field | Value |
| --- | --- |
| Identifier | FR-007 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-008

| Field | Value |
| --- | --- |
| Identifier | FR-008 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-009

| Field | Value |
| --- | --- |
| Identifier | FR-009 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

#### FR-010

| Field | Value |
| --- | --- |
| Identifier | FR-010 |
| Name |  |
| Type | Functional |
| Priority |  |
| Source |  |
| Owner |  |
| Author |  |
| Business area |  |
| Stakeholders |  |
| Pattern used |  |
| Pattern domain |  |
| Related patterns |  |
| Classification (Functional / Pervasive / Affects DB) |  |
| Applicability |  |
| Description |  |
| Content items |  |
| Pre-condition |  |
| Post-condition |  |
| Criticality |  |
| Technical issues |  |
| Cost & schedule |  |
| Risks |  |
| Dependencies |  |
| Associated NFRs |  |
| Related requirements |  |
| Related documents |  |
| Acceptance criteria |  |
| Follow-on requirements |  |
| Considerations for development |  |
| Considerations for testing |  |
| Version history |  |

## 4. Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 Graphical User Interface

| Screen ID | Screen name | Description | Mock-up reference |
| --- | --- | --- | --- |
| UI-001 |  |  |  |
| UI-002 |  |  |  |
| UI-003 |  |  |  |

#### 4.1.2 Command-Line Interface

| Command | Arguments | Description | Example |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |

#### 4.1.3 Application Programming Interface

| Function name | Arguments (type) | Return value (type) | Side effects | Example |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |

### 4.2 Hardware Interfaces

| Device | Purpose | Interface description |
| --- | --- | --- |
|  |  |  |
|  |  |  |

### 4.3 Communications Interfaces

| Protocol | Purpose | Description |
| --- | --- | --- |
|  |  |  |
|  |  |  |

### 4.4 Software Interfaces

| External software | Purpose | Interface type |
| --- | --- | --- |
|  |  |  |
|  |  |  |

## 5. Performance Requirements

| Identifier | Requirement | Metric / Threshold |
| --- | --- | --- |
| PR-001 |  |  |
| PR-002 |  |  |
| PR-003 |  |  |
| PR-004 |  |  |

## 6. Design Constraints

### 6.1 Standards Compliance

1.
2.

### 6.2 Hardware Limitations

1.
2.

### 6.3 Other Constraints

1.
2.

## 7. Other Non-Functional Attributes

| Identifier | Attribute | Requirement |
| --- | --- | --- |
| NFR-001 | Security |  |
| NFR-002 | Reliability |  |
| NFR-003 | Maintainability |  |
| NFR-004 | Portability |  |
| NFR-005 | Extensibility |  |
| NFR-006 | Re-usability |  |
| NFR-007 | Application affinity |  |
| NFR-008 | Resource utilization |  |
| NFR-009 | Serviceability |  |
| NFR-010 | Other |  |

## 8. Diagrams

This section collects the diagrams that describe the system at the design level. Replace each placeholder with the corresponding screenshot.

### 8.1 Class Diagram

> _Insert class diagram screenshot here._

**Figure 8-1.** Class diagram.

### 8.2 Use Case Diagram

> _Insert use case diagram screenshot here._

**Figure 8-2.** Use case diagram.

### 8.3 Sequence Diagram

> _Insert sequence diagram screenshot here._

**Figure 8-3.** Sequence diagram.

### 8.4 Other Diagrams

> _Insert additional diagram screenshot here._

**Figure 8-4.** Additional diagram.

## 9. Operational Scenarios

#### SC-001

| Field | Value |
| --- | --- |
| Identifier | SC-001 |
| Name |  |
| Related requirements |  |
| Actors |  |
| Pre-condition |  |
| Post-condition |  |
| Trigger |  |
| Main flow |  |
| Alternative flows |  |
| Exceptions |  |

#### SC-002

| Field | Value |
| --- | --- |
| Identifier | SC-002 |
| Name |  |
| Related requirements |  |
| Actors |  |
| Pre-condition |  |
| Post-condition |  |
| Trigger |  |
| Main flow |  |
| Alternative flows |  |
| Exceptions |  |

#### SC-003

| Field | Value |
| --- | --- |
| Identifier | SC-003 |
| Name |  |
| Related requirements |  |
| Actors |  |
| Pre-condition |  |
| Post-condition |  |
| Trigger |  |
| Main flow |  |
| Alternative flows |  |
| Exceptions |  |

## 10. Preliminary Schedule

| Task ID | Task name | Dependencies | Start | End | Owner | Resources |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 |  |  |  |  |  |  |
| T-002 |  |  |  |  |  |  |
| T-003 |  |  |  |  |  |  |
| T-004 |  |  |  |  |  |  |
| T-005 |  |  |  |  |  |  |
| T-006 |  |  |  |  |  |  |
| T-007 |  |  |  |  |  |  |
| T-008 |  |  |  |  |  |  |

### 10.1 Gantt or PERT Chart

> _Insert schedule chart screenshot here._

**Figure 10-1.** Project schedule.

## 11. Preliminary Budget

| Cost factor | Item | Quantity | Unit cost | Total |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
| **Grand total** |  |  |  |  |

## 12. Appendices

### 12.1 Definitions, Acronyms, Abbreviations

| Term | Definition |
| --- | --- |
|  |  |
|  |  |
|  |  |
|  |  |

### 12.2 Collected Material

1.
2.
3.

## 13. References

| Reference | Citation |
| --- | --- |
| [1] |  |
| [2] |  |
| [3] |  |
