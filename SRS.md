# Software Requirements Specification

## Sonoschool

## Document Control

| Field                | Value                                     |
| -------------------- | ----------------------------------------- |
| Document version     | V1.0                                      |
| Status               | Draft                                     |
| Authors              | Mohamed Hany                              |
| Supervisor           | Dr. Mohamed Labib                         |
| Faculty / University | MSA - Modern Sciences and Arts University |
| Date of issue        | 16-05-2026                                |

### Revision History

| Version | Date       | Author       | Description              |
| ------- | ---------- | ------------ | ------------------------ |
| V1.0    | 16-05-2026 | Mohamed Hany | Document Initial Version |
|         |            |              |                          |

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
| ---------- | ---- | -------- | ------- | ------ |
| FR-001     |      |          |         |        |
| FR-002     |      |          |         |        |
| FR-003     |      |          |         |        |
| FR-004     |      |          |         |        |
| FR-005     |      |          |         |        |
| FR-006     |      |          |         |        |
| FR-007     |      |          |         |        |
| FR-008     |      |          |         |        |
| FR-009     |      |          |         |        |
| FR-010     |      |          |         |        |

### 3.2 Pattern Catalogue

| Pattern ID | Pattern name | Domain | Refers to | Extends | Classification |
| ---------- | ------------ | ------ | --------- | ------- | -------------- |
| P-01       |              |        |           |         |                |
| P-02       |              |        |           |         |                |
| P-03       |              |        |           |         |                |
| P-04       |              |        |           |         |                |
| P-05       |              |        |           |         |                |

### 3.3 Pervasive Requirements

| Identifier | Pattern | Statement |
| ---------- | ------- | --------- |
| PRV-001    |         |           |
| PRV-002    |         |           |
| PRV-003    |         |           |

### 3.4 Requirement Details

#### FR-001

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-001     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-002

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-002     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-003

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-003     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-004

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-004     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-005

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-005     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-006

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-006     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-007

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-007     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-008

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-008     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-009

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-009     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

#### FR-010

| Field                                                | Value      |
| ---------------------------------------------------- | ---------- |
| Identifier                                           | FR-010     |
| Name                                                 |            |
| Type                                                 | Functional |
| Priority                                             |            |
| Source                                               |            |
| Owner                                                |            |
| Author                                               |            |
| Business area                                        |            |
| Stakeholders                                         |            |
| Pattern used                                         |            |
| Pattern domain                                       |            |
| Related patterns                                     |            |
| Classification (Functional / Pervasive / Affects DB) |            |
| Applicability                                        |            |
| Description                                          |            |
| Content items                                        |            |
| Pre-condition                                        |            |
| Post-condition                                       |            |
| Criticality                                          |            |
| Technical issues                                     |            |
| Cost & schedule                                      |            |
| Risks                                                |            |
| Dependencies                                         |            |
| Associated NFRs                                      |            |
| Related requirements                                 |            |
| Related documents                                    |            |
| Acceptance criteria                                  |            |
| Follow-on requirements                               |            |
| Considerations for development                       |            |
| Considerations for testing                           |            |
| Version history                                      |            |

## 4. Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 Graphical User Interface

| Screen ID | Screen name                     | Description                                                         | Mock-up reference            |
| --------- | ------------------------------- | ------------------------------------------------------------------- | ---------------------------- |
| UI-001    | User Landing Page               | The screen shall display the public homepage for visitors.          | LandingPage.jsx              |
| UI-002    | Courses Page                    | The screen shall display available courses for visitors and users.  | CoursesPage.jsx              |
| UI-003    | Course Details Page             | The screen shall display selected course details.                   | CourseDetail.jsx             |
| UI-004    | Course View Page                | The screen shall display the selected learning course area.         | CourseView.jsx               |
| UI-005    | Lecture View Page               | The screen shall display selected lecture content.                  | LectureView.jsx              |
| UI-006    | Exam View Page                  | The screen shall display the course exam interface.                 | ExamView.jsx                 |
| UI-007    | Exam Review Page                | The screen shall display exam review content.                       | ExamView.jsx                 |
| UI-008    | User Login Page                 | The screen shall allow users to log in.                             | UserLogin.jsx                |
| UI-009    | User Registration Page          | The screen shall allow new users to register.                       | UserRegister.jsx             |
| UI-010    | User Home Page                  | The screen shall display the authenticated user homepage.           | UserHome.jsx                 |
| UI-011    | My Courses Page                 | The screen shall display the user’s enrolled courses.               | MyCourses.jsx                |
| UI-012    | Certificates Page               | The screen shall display user certificates.                         | Certificates.jsx             |
| UI-013    | Verify Certificate Page         | The screen shall allow certificate verification.                    | VerifyCertificate.jsx        |
| UI-014    | User Profile Page               | The screen shall display user profile information.                  | UserProfile.jsx              |
| UI-015    | Mission and Vision Page         | The screen shall display mission and vision content.                | MissionVision.jsx            |
| UI-016    | Board of Directors Page         | The screen shall display board of directors content.                | BoardOfDirectors.jsx         |
| UI-017    | MENA Board Page                 | The screen shall display MENA board content.                        | MENABoard.jsx                |
| UI-018    | Scientific Committee Page       | The screen shall display scientific committee content.              | ScientificCommittee.jsx      |
| UI-019    | Clinical Advisors Page          | The screen shall display clinical advisors content.                 | ClinicalAdvisors.jsx         |
| UI-020    | Business Partners Page          | The screen shall display business partners content.                 | BusinessPartners.jsx         |
| UI-021    | Scientific Partners Page        | The screen shall display scientific partners content.               | ScientificPartners.jsx       |
| UI-022    | Policies Page                   | The screen shall display platform policies.                         | Policies.jsx                 |
| UI-023    | Admin Login Page                | The screen shall allow Admin users to log in.                       | Login.jsx                    |
| UI-024    | Admin Dashboard                 | The screen shall display Admin dashboard data.                      | AdminDashboard.jsx           |
| UI-025    | Site Content Page               | The screen shall allow Admin users to manage website content.       | SiteContent.jsx              |
| UI-026    | Educational Centers Page        | The screen shall display educational center records.                | EducationalCenters.jsx       |
| UI-027    | Add Educational Center Page     | The screen shall allow Admin users to create an educational center. | AddEducationalCenter.jsx     |
| UI-028    | Edit Educational Center Page    | The screen shall allow Admin users to update an educational center. | EditEducationalCenter.jsx    |
| UI-029    | Educational Center Profile Page | The screen shall display one educational center profile.            | EducationalCenterProfile.jsx |
| UI-030    | Users Management Page           | The screen shall display platform users.                            | Users.jsx                    |
| UI-031    | Add User Page                   | The screen shall allow Admin users to create a user.                | AddUser.jsx                  |
| UI-032    | Edit User Page                  | The screen shall allow Admin users to update a user.                | EditUser.jsx                 |
| UI-033    | Student Permissions Page        | The screen shall allow Admin users to manage student permissions.   | StudentPermissions.jsx       |
| UI-034    | Admin Permissions Page          | The screen shall allow Admin users to manage admin permissions.     | AdminPermissions.jsx         |
| UI-035    | Admin Courses Page              | The screen shall display course records for Admin users.            | Courses.jsx                  |
| UI-036    | Add Course Page                 | The screen shall allow Admin users to create a course.              | AddCourse.jsx                |
| UI-037    | Edit Course Page                | The screen shall allow Admin users to update a course.              | EditCourse.jsx               |
| UI-038    | Course Students Page            | The screen shall display students enrolled in a course.             | CourseStudents.jsx           |
| UI-039    | Payments Page                   | The screen shall display payment records.                           | Payments.jsx                 |
| UI-040    | Payment Settings Page           | The screen shall allow Admin users to manage payment settings.      | PaymentSettings.jsx          |
| UI-041    | Settings Page                   | The screen shall allow Admin users to manage platform settings.     | Settings.jsx                 |
| UI-042    | Help Page                       | The screen shall display help content for Admin users.              | Help.jsx                     |
| UI-043    | Approve Instructors Page        | The screen shall allow Admin users to approve instructors.          | ApproveInstructors.jsx       |
| UI-044    | Reports Page                    | The screen shall display system reports.                            | Reports.jsx                  |
| UI-045    | Notifications Page              | The screen shall display platform notifications.                    | Notifications.jsx            |
| UI-046    | Admin Profile Page              | The screen shall display Admin profile information.                 | Profile.jsx                  |
| UI-047    | Edit Admin Profile Page         | The screen shall allow Admin users to update profile information.   | EditAdminProfile.jsx         |
| UI-048    | Admin Role Page                 | The screen shall display Admin role information.                    | AdminRole.jsx                |
| UI-049    | System Logs Page                | The screen shall display system activity logs.                      | SystemLogs.jsx               |
| UI-050    | Bulk Announcements Page         | The screen shall allow Admin users to send bulk announcements.      | BulkAnnouncements.jsx        |

#### 4.1.2 Command-Line Interface

| Command | Arguments | Description                                                                                                                                  | Example |
| ------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| N/A     | N/A       | The system shall not provide a user-facing command-line interface. Users shall interact with the system through the graphical web interface. | N/A     |

#### 4.1.3 Application Programming Interface

| Function name            | Arguments (type)                        | Return value (type)                              | Side effects                                                     | Example                    |
| ------------------------ | --------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- | -------------------------- |
| Authentication API       | credentials: object                     | user data and token: object                      | The system shall authenticate users.                             | `/api/auth`                |
| Admin API                | token: string, adminData: object        | admin data: object                               | The system shall retrieve or update Admin data.                  | `/api/admin`               |
| Announcements API        | announcementData: object, token: string | announcement result: object                      | The system shall manage announcements.                           | `/api/announcements`       |
| Fix Super Admin API      | token: string                           | updated admin user: object                       | The system shall update the current Admin to Super Admin access. | `/api/fix-super-admin/me`  |
| Dashboard API            | token: string                           | dashboard statistics: object                     | The system shall retrieve Admin dashboard data.                  | `/api/dashboard`           |
| Users API                | userData: object, token: string         | user object or users array: object/array         | The system shall manage user records.                            | `/api/users`               |
| Educational Centers API  | centerData: object, token: string       | educational center object or array: object/array | The system shall manage educational center records.              | `/api/educational-centers` |
| Courses API              | courseData: object, token: string       | course object or courses array: object/array     | The system shall manage course records.                          | `/api/courses`             |
| Payments API             | paymentData: object, token: string      | payment object or payments array: object/array   | The system shall manage payment records.                         | `/api/payments`            |
| Settings API             | settingsData: object, token: string     | settings object: object                          | The system shall manage platform settings.                       | `/api/settings`            |
| Public Page Content API  | pageKey: string                         | public page content: object                      | The system shall retrieve public website content.                | `/api/public/page-content` |
| Page Content API         | pageContentData: object, token: string  | page content object: object                      | The system shall manage editable page content.                   | `/api/page-content`        |
| Reports API              | filters: object, token: string          | report data: object/array                        | The system shall retrieve report data.                           | `/api/reports`             |
| Lectures API             | lectureData: object, token: string      | lecture object or lectures array: object/array   | The system shall manage lecture content.                         | `/api/lectures`            |
| System Logs API          | token: string                           | logs array: array                                | The system shall retrieve system logs.                           | `/api/system-logs`         |
| Support Requests API     | requestData: object, token: string      | support request object or array: object/array    | The system shall manage support requests.                        | `/api/support-requests`    |
| User Side API            | userData: object                        | user-side response: object                       | The system shall handle user-facing operations.                  | `/api/user`                |
| Backend Health Check API | N/A                                     | text message: string                             | The system shall return backend status.                          | `/`                        |

### 4.2 Hardware Interfaces

| Device                          | Purpose                                                                                  | Interface description                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| User laptop or desktop computer | The device shall allow users to access the platform.                                     | The device shall use a modern web browser.                                 |
| Mobile device                   | The device shall allow users to access the platform on smaller screens.                  | The device shall use a mobile web browser.                                 |
| Server machine                  | The device shall host the backend application.                                           | The device shall support Node.js runtime.                                  |
| Database server                 | The device shall store platform data.                                                    | The backend shall connect to MongoDB through a database connection string. |
| Network device                  | The device shall support data exchange between frontend, backend, and database services. | The network shall support HTTP or HTTPS communication.                     |

### 4.3 Communications Interfaces

| Protocol                    | Purpose                              | Description                                                                                           |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| HTTP                        | Local frontend-backend communication | The system shall use HTTP during local development.                                                   |
| HTTPS                       | Secure production communication      | The system shall use HTTPS in production.                                                             |
| REST                        | API communication style              | The system shall expose backend services through REST-style endpoints.                                |
| JSON                        | Data exchange format                 | The system shall send and receive request data in JSON format.                                        |
| URL-Encoded Form Data       | Form submission support              | The system shall support URL-encoded form data.                                                       |
| CORS                        | Cross-origin communication           | The system shall allow the frontend application to communicate with the backend server.               |
| MongoDB Connection Protocol | Backend-database communication       | The backend shall connect to MongoDB through a database connection URI.                               |
| JWT / Token Authentication  | Protected route access               | The system shall protect private routes using authentication tokens.                                  |
| SMTP                        | Email communication                  | The system shall use SMTP if email notifications are enabled.                                         |
| Payment Gateway API         | Payment communication                | The system shall communicate with an external payment provider if real payment processing is enabled. |

### 4.4 Software Interfaces

| External software             | Purpose                                                                             | Interface type                 |
| ----------------------------- | ----------------------------------------------------------------------------------- | ------------------------------ |
| React.js                      | The system shall use React.js to build the frontend user interface.                 | Frontend framework             |
| React Router                  | The system shall map frontend URLs to pages.                                        | Frontend routing interface     |
| Vite                          | The system shall run and build the React frontend.                                  | Frontend build tool            |
| Tailwind CSS                  | The system shall style frontend screens.                                            | Styling framework              |
| Node.js                       | The system shall run the backend application.                                       | Backend runtime                |
| Express.js                    | The system shall define backend routes and middleware.                              | Backend framework              |
| CORS middleware               | The system shall allow controlled frontend-backend communication.                   | Backend middleware             |
| dotenv                        | The system shall load configuration values from environment variables.              | Configuration interface        |
| MongoDB                       | The system shall store users, courses, payments, reports, settings, and logs.       | Database                       |
| Mongoose                      | The system shall connect backend models to MongoDB collections.                     | Database access layer          |
| JWT library                   | The system shall authenticate protected requests using tokens.                      | Authentication interface       |
| bcrypt library                | The system shall protect passwords through hashing.                                 | Security library               |
| Authentication Middleware     | The system shall protect private routes using `protect` and `requireAdmin`.         | Security middleware            |
| Audit Log Middleware          | The system shall record system activity.                                            | Logging middleware             |
| Frontend API Layer            | The system shall connect React pages to backend endpoints.                          | Internal API interface         |
| Payment Provider              | The system shall handle payment processing through an external provider if enabled. | External API                   |
| Email Service / SMTP Provider | The system shall send email notifications if enabled.                               | External communication service |
| GitHub                        | The system shall support source code version control.                               | Version control platform       |

## 5. Performance Requirements

| Identifier | Requirement                                                                                                                      | Metric / Threshold                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| PR-001     | The system shall load the Admin dashboard summary data within an acceptable response time under normal local testing conditions. | Target response time: up to 1000 ms during local testing.                                                             |
| PR-002     | The system shall load the public courses page within an acceptable page-load time on a stable connection.                        | Target page-load time: up to 3000 ms on a stable internet connection.                                                 |
| PR-003     | The system shall support large request bodies for course content, page content, and file-related operations.                     | Maximum request body size: 200 MB, based on backend request body configuration.                                       |
| PR-004     | The system shall generate Admin reports within an acceptable processing time for normal system usage.                            | Target report generation time: up to 5000 ms for moderate-size datasets.                                              |
| PR-005     | The system shall allow multiple users to access the platform at the same time.                                                   | Supported through the web-based client-server architecture; formal concurrent-user load testing is not yet completed. |
| PR-006     | The system shall complete login authentication within an acceptable response time.                                               | Target response time: up to 1500 ms during local testing.                                                             |
| PR-007     | The system shall load system logs within an acceptable response time for Admin review.                                           | Target response time: up to 3000 ms for normal log retrieval.                                                         |
| PR-008     | The system shall load course lecture content within an acceptable response time on a stable connection.                          | Target response time: up to 3000 ms on a stable internet connection.                                                  |

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

| Identifier | Attribute             | Requirement                                                                                                                                                                                                                                                                                    |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-001    | Security              | The system shall protect restricted pages from unauthenticated users. Applied in the project: login authentication and protected routes are used before users can access restricted dashboards.                                                                                                |
| NFR-002    | Reliability           | The system shall continue operating when an API request fails. Applied in the project: failed requests display error messages instead of breaking the whole interface.                                                                                                                         |
| NFR-003    | Maintainability       | The system shall separate frontend code from backend code. Applied in the project: the project has separate frontend and backend folders.                                                                                                                                                      |
| NFR-004    | Portability           | The system shall run on modern web browsers. Applied in the project: the system runs as a web-based MERN application.                                                                                                                                                                          |
| NFR-005    | Extensibility         | The system shall allow new pages and features to be added without rebuilding the whole project. Applied in the project: new dashboard pages and features can be added through React routing, separated components, and backend route modules.                                                  |
| NFR-006    | Re-usability          | The system shall reuse shared interface components and API helper files. Applied in the project: navigation bars, forms, buttons, cards, rich text editor components, and API helper files are reused across the system.                                                                       |
| NFR-007    | Application Affinity  | The system shall follow the selected MERN-stack architecture. Applied in the project: the project uses MongoDB, Express.js, React.js, and Node.js.                                                                                                                                             |
| NFR-008    | Resource Utilization  | The system shall reduce unnecessary data transfer between the frontend and backend. Applied in the project: some endpoints return lightweight data only, and heavy files such as certificates or materials are fetched separately when needed.                                                 |
| NFR-009    | Serviceability        | The system shall allow developers and Admin users to identify, trace, and diagnose system issues. Applied in the project: system logs record important actions such as create, update, archive, restore, delete, login attempts, and failed actions.                                           |
| NFR-010    | Response Time         | The system shall load dashboard and main page data within an acceptable response time under normal local testing conditions. Applied in the project: dashboard pages and main modules retrieve data through backend API requests and display the results without blocking the whole interface. |
| NFR-011    | Authentication        | The system shall require each user to log in before accessing private pages. Applied in the project: Admin, Instructor, and Student users must log in before entering protected dashboards or private pages.                                                                                   |
| NFR-012    | Authorization         | The system shall restrict each user role to its assigned permissions. Applied in the project: role-based access is used to separate Admin, Super Admin, Instructor, and Student permissions.                                                                                                   |
| NFR-013    | Password Protection   | The system shall protect user password data. Applied in the project: password data is handled through backend authentication logic, and password hash fields are excluded from returned user data.                                                                                             |
| NFR-014    | Session Management    | The system shall maintain user sessions using authentication tokens. Applied in the project: logged-in users are identified using JWT tokens stored on the client side and sent with protected API requests.                                                                                   |
| NFR-015    | Availability          | The system shall remain accessible while the frontend and backend servers are running. Applied in the project: the system can be accessed locally when both the React frontend and Node.js backend servers are running successfully.                                                           |
| NFR-016    | Error Handling        | The system shall display an error message when a request fails. Applied in the project: error messages appear during failed login, unauthorized access, failed form submission, failed data loading, and invalid requests.                                                                     |
| NFR-017    | Input Validation      | The system shall validate required fields before saving records. Applied in the project: required fields are checked in forms, backend routes, and database models before records are saved.                                                                                                   |
| NFR-018    | Data Integrity        | The system shall prevent incomplete or duplicate required records from being stored. Applied in the project: MongoDB models use required fields, enums, validation rules, and unique indexes to protect stored data.                                                                           |
| NFR-019    | Performance           | The system shall load page data through backend API requests instead of placing all data directly inside frontend pages. Applied in the project: pages request data from backend endpoints according to the needed module or page function.                                                    |
| NFR-020    | Scalability           | The system shall allow new users, courses, and platform records to be added without changing the main system structure. Applied in the project: the MERN architecture, database models, and separated API modules allow the system to grow by adding more records and features.                |
| NFR-021    | Modularity            | The system shall divide features into independent modules. Applied in the project: users, courses, payments, reports, settings, notifications, educational centers, support requests, and system logs are organized as separate modules.                                                       |
| NFR-022    | Accessibility         | The system shall use readable labels and clear form controls on main pages. Applied in the project: main forms and buttons include visible labels, placeholders, and clear action text.                                                                                                        |
| NFR-023    | Audit Trail           | The system shall allow Admin users to review system changes. Applied in the project: Admin users can view logged actions through the system logs feature.                                                                                                                                      |
| NFR-024    | Monitoring            | The system shall track important backend and system activities. Applied in the project: the dashboard includes notifications, recent activity, alerts, and performance-related routes.                                                                                                         |
| NFR-025    | Logging               | The system shall record important system actions. Applied in the project: system logs track create, update, archive, restore, delete, login, refund, reminder, and status update actions.                                                                                                      |
| NFR-026    | Backup                | The system shall support manual database backup and restore operations. Applied in the project: backend settings routes include manual backup and restore endpoints.                                                                                                                           |
| NFR-027    | Configuration         | The system shall store sensitive configuration outside frontend source code. Applied in the project: API URLs, database connection strings, secret keys, and payment environment variables are handled through configuration values and environment variables.                                 |
| NFR-028    | Deployment Readiness  | The system shall separate frontend deployment from backend deployment. Applied in the project: the frontend and backend are separated into different project parts, which supports independent deployment preparation.                                                                         |
| NFR-029    | Interoperability      | The system shall exchange data using JSON format. Applied in the project: the frontend communicates with the backend through REST APIs using JSON request and response bodies.                                                                                                                 |
| NFR-030    | API Consistency       | The system shall use structured API routes for system features. Applied in the project: routes exist for users, courses, reports, payments, settings, notifications, announcements, educational centers, support requests, and system logs.                                                    |
| NFR-031    | Privacy               | The system shall protect user account data and sensitive system data from unauthorized access. Applied in the project: authentication, role-based access, protected routes, and log sanitization are used to protect user data, tokens, passwords, and payment-related data.                   |
| NFR-032    | Data Storage          | The system shall store platform records in MongoDB. Applied in the project: users, courses, lectures, enrollments, payments, reports, notifications, certificates, support requests, and logs are stored in MongoDB models.                                                                    |
| NFR-033    | Data Retrieval        | The system shall retrieve stored records through backend endpoints. Applied in the project: frontend pages retrieve MongoDB data through Express API routes.                                                                                                                                   |
| NFR-034    | Frontend Consistency  | The system shall use consistent visual styling across main pages. Applied in the project: pages use consistent layouts, forms, buttons, cards, loading states, and dashboard components.                                                                                                       |
| NFR-035    | Backend Consistency   | The system shall organize backend logic using consistent folders and route structures. Applied in the project: backend code is organized into routes, controllers, models, and middleware.                                                                                                     |
| NFR-036    | Role Separation       | The system shall separate Admin access from User access. Applied in the project: Admin pages are protected from non-Admin users, and User routes use separate user authentication middleware.                                                                                                  |
| NFR-037    | Admin Control         | The system shall allow Admin users to manage platform records. Applied in the project: Admin users can manage users, courses, educational centers, reports, payments, settings, notifications, announcements, support requests, and logs.                                                      |
| NFR-038    | Payment Configuration | The system shall allow payment settings and payment-related operations to be managed. Applied in the project: payment settings, payment transactions, checkout sessions, payment status checks, refund requests, reminders, and Kashier webhook routes exist.                                  |
| NFR-039    | Notification Support  | The system shall support notification-related features. Applied in the project: notification features, latest notifications, all notifications, dashboard notifications, and bulk announcement features exist.                                                                                 |
| NFR-040    | Searchability         | The system shall allow records to be displayed and filtered in organized lists. Applied in the project: educational centers, payments, support requests, and system logs support search or filter parameters, while users, courses, and logs are displayed in organized pages.                 |
| NFR-041    | Data Consistency      | The system shall keep related data organized through database models. Applied in the project: MongoDB schemas use structured fields, references, enums, and relationships to keep related data consistent.                                                                                     |
| NFR-042    | System Traceability   | The system shall allow system changes to be traced. Applied in the project: system logs store actor information, module name, action type, target entity, request status, method, path, IP address, user agent, and sanitized request data.                                                    |

## 8. Diagrams

This section collects the diagrams that describe the system at the design level.

### 8.1 Class Diagram

![Class Diagram](diagrams/class%20diagram.svg)

**Figure 8-1.** Class diagram.

### 8.2 Use Case Diagram


![Use Case Diagram](diagrams/Use%20case.png)

**Figure 8-2.** Use case diagram.

### 8.3 Sequence Diagrams

#### 8.3.1 SC-001 – Visitor Browses and Views Course Details

![SC-001 Sequence Diagram](diagrams/SC-001.png)

**Figure 8-3.** Sequence diagram — SC-001.

#### 8.3.2 SC-002 – Visitor Registers an Account

![SC-002 Sequence Diagram](diagrams/SC-002.png)

**Figure 8-4.** Sequence diagram — SC-002.

#### 8.3.3 SC-003 – User Enrolls in a Course via Payment

![SC-003 Sequence Diagram](diagrams/SC-003.png)

**Figure 8-5.** Sequence diagram — SC-003.

#### 8.3.4 SC-004 – User Watches Course Content Progressively

![SC-004 Sequence Diagram](diagrams/SC-004.png)

**Figure 8-6.** Sequence diagram — SC-004.

#### 8.3.5 SC-005 – User Takes the Final Exam

![SC-005 Sequence Diagram](diagrams/SC-005.png)

**Figure 8-7.** Sequence diagram — SC-005.

#### 8.3.6 SC-006 – User Completes Course and Leaves a Review

![SC-006 Sequence Diagram](diagrams/SC-006.png)

**Figure 8-8.** Sequence diagram — SC-006.

#### 8.3.7 SC-007 – User Asks and Browses Q&A

![SC-007 Sequence Diagram](diagrams/SC-007.png)

**Figure 8-9.** Sequence diagram — SC-007.

#### 8.3.8 SC-008 – Admin Creates and Publishes a Course

![SC-008 Sequence Diagram](diagrams/SC-008.png)

**Figure 8-10.** Sequence diagram — SC-008.

#### 8.3.9 SC-009 – Admin Monitors and Exports Reports

![SC-009 Sequence Diagram](diagrams/SC-009.png)

**Figure 8-11.** Sequence diagram — SC-009.

## 9. Operational Scenarios

## SC-001

| Field | Value |
|---|---|
| **Identifier** | SC-001 |
| **Name** | Visitor Browses and Views Course Details |
| **Related Requirements** | UAM-02, CRS-02 |
| **Actors** | Unauthenticated Visitor |
| **Pre-condition** | - At least one public course exists on the platform <br> - Course visibility is set to "Public" by Admin |
| **Post-condition** | No system state changes — read-only interaction |
| **Trigger** | Visitor clicks "Browse Catalogue" |
| **Main Flow** | 1. Visitor clicks "Browse Catalogue" <br> 2. System displays all public courses with basic info <br> 3. Visitor searches for a course by name <br> 4. System returns all courses matching the search term <br> 5. Visitor selects a course from the results <br> 6. System displays full course details (directors, dates, accommodation, price, content overview) |
| **Alternative Flows** | [A1] No search results: System displays "No results found" and suggests bestseller or featured courses <br><br> [A2] Visitor navigates directly to a private or archived course URL: System responds with "This course is no longer available" |
| **Exceptions** | [E1] Database unavailable: System displays a generic error page and logs the failure |

---

## SC-002

| Field | Value |
|---|---|
| **Identifier** | SC-002 |
| **Name** | Visitor Registers an Account |
| **Related Requirements** | UAM-01, UAM-03 |
| **Actors** | Unauthenticated Visitor |
| **Pre-condition** | None |
| **Post-condition** | - An active student account is created <br> - System generates a unique certificate code tied to the user's account <br> - User is authenticated |
| **Trigger** | - Visitor clicks "Register" from the navigation <br> - Visitor clicks "Register" when prompted during course purchase |
| **Main Flow** | 1. Visitor clicks "Register" <br> 2. System displays the registration form <br> 3. Visitor fills in name, email, phone number, password, and any other required fields <br> 4. Visitor submits the form <br> 5. System sends a welcome email to the user <br> 6. System logs the user in automatically <br> 7. User is redirected to "My Learning" page |
| **Alternative Flows** | [A1] Missing required fields: System highlights empty fields and displays "Please fill out required fields" — form is not submitted <br><br> [A2] Email or phone already registered: System displays "Email or phone already exists, try logging in" and prompts user to correct the input <br><br> [A3] Registration triggered during course purchase: Upon successful registration, system redirects user back to checkout instead of "My Learning" page |
| **Exceptions** | [E1] Email service unavailable: Welcome email fails to send but account is still created successfully <br><br> [E2] Database error during account creation: System displays "Something went wrong, please try again" and no account is created |

---

## SC-003

| Field | Value |
|---|---|
| **Identifier** | SC-003 |
| **Name** | User Enrolls in a Course via Payment |
| **Related Requirements** | UAM-03, PAY-01, PAY-02, PAY-03, CRS-04 |
| **Actors** | User, Payment Gateway |
| **Pre-condition** | - User has an active student account and is logged in <br> - Course visibility is set to "Public" <br> - User is not already enrolled in the course |
| **Post-condition** | - User is enrolled in the course <br> - System unlocks read-only documents, pre-test, and first video; remaining content stays locked <br> - System stores payment record and generates an invoice to the user |
| **Trigger** | User adds a course to cart |
| **Main Flow** | 1. User adds course to cart <br> 2. User clicks "Cart" <br> 3. System displays cart items, individual prices, and total <br> 4. User proceeds to checkout <br> 5. User selects a payment method <br> 6. System delegates the payment process to the payment service provider <br> 7. User enters billing information <br> 8. User submits billing info and confirms payment <br> 9. Payment gateway sends a payment confirmation and reference number to the system <br> 10. System displays a success message <br> 11. User is redirected to the course page |
| **Alternative Flows** | [A1] Payment declined: System prompts user to try another payment method or verify sufficient balance <br><br> [A2] Payment gateway timeout: System displays "Payment through [gateway] timed out, try again later" and prompts user to try another payment method |
| **Exceptions** | [E1] Payment gateway unreachable: System displays "Payment service is currently unavailable, please try again later" and no charge is made <br><br> [E2] Enrollment confirmation lost after successful payment: System retries enrollment automatically; if retry fails, system flags the transaction for manual Admin review |

---

## SC-004

| Field | Value |
|---|---|
| **Identifier** | SC-004 |
| **Name** | User Watches Course Content Progressively |
| **Related Requirements** | CRS-04, CRS-05, SEC-01, SEC-02, SEC-03 |
| **Actors** | User |
| **Pre-condition** | - User is enrolled in the course <br> - User has completed the course pre-test |
| **Post-condition** | - Video is marked as completed <br> - Next video is unlocked <br> - User progress is updated |
| **Trigger** | User opens the course page |
| **Main Flow** | 1. User opens the course <br> 2. System automatically displays the next unwatched lecture as the main video and lists all previous (unlocked) lectures; remaining lectures are locked <br> 3. User selects a video to watch <br> 4. System generates a tokenized, time-limited streaming URL tied to the user's session <br> 5. System streams the video to the user on the video streaming page <br> 6. User finishes watching and is redirected back to the course page |
| **Alternative Flows** | [A1] User attempts to access a locked video: System blocks URL access server-side and displays "Complete previous videos before accessing this video" <br><br> [A2] Streaming URL expires mid-watch: Stream stops; user refreshes to generate a new token; watch progress is saved up to the last point watched <br><br> [A3] User attempts to download the video: System displays a floating watermark with user credentials and disables all download controls within the video player |
| **Exceptions** | [E1] Streaming service unavailable: System displays "Video is currently unavailable, please try again later" and progress is not affected <br><br> [E2] Progress update fails after video completion: System retries the update; if retry fails, it is flagged for manual correction to prevent incorrect content locking |

---

## SC-005

| Field | Value |
|---|---|
| **Identifier** | SC-005 |
| **Name** | User Takes the Final Exam |
| **Related Requirements** | EXM-01, EXM-02, EXM-03, EXM-04, EXM-05, UAM-05 |
| **Actors** | User |
| **Pre-condition** | User has completed all course videos, quizzes, and content before the final exam |
| **Post-condition** | Exam attempt is stored with score, timestamp, and pass/fail status |
| **Trigger** | User selects the final exam from the course page |
| **Main Flow** | 1. User opens the course from "My Learning" <br> 2. User selects the unlocked final exam <br> 3. System displays the exam questions <br> 4. User answers all questions and submits <br> 5. System stores the exam answers and calculates the score server-side <br> 6. System displays results immediately <br> 7. System informs the user of their score and pass/fail status based on the 70% passing threshold |
| **Alternative Flows** | [A1] User fails but has remaining attempts: System displays the score and recommends lectures to revisit before retaking <br><br> [A2] User runs out of attempts: System locks the exam permanently and instructs the user to contact Admin for a reset <br><br> [A3] User passes the final exam: System issues a downloadable certificate and sends it to the user via email |
| **Exceptions** | [E1] Submission fails mid-exam due to connection loss: System attempts to recover last saved answers; if unrecoverable, the attempt is not counted and user is notified <br><br> [E2] Certificate generation fails after passing: System retries issuance; if retry fails, Admin is notified to issue it manually |

---

## SC-006

| Field | Value |
|---|---|
| **Identifier** | SC-006 |
| **Name** | User Completes Course and Leaves a Review |
| **Related Requirements** | UAM-05, UAM-06 |
| **Actors** | User |
| **Pre-condition** | - User has passed the final exam with a score of 70% or higher <br> - User has completed all course content |
| **Post-condition** | Review is stored with star rating and comment tied to the user and course |
| **Trigger** | User navigates to the review section of the course page |
| **Main Flow** | 1. User opens the course page <br> 2. User navigates to the review section <br> 3. System displays existing course ratings and comments and prompts the user to leave a review <br> 4. User selects a star rating (out of 5) <br> 5. User writes a comment <br> 6. User submits the review <br> 7. System displays an appreciation message and recommends similar courses |
| **Alternative Flows** | [A1] User attempts to leave a second review: System updates the existing review with the new rating and comment *(Note: extension beyond UAM-06 — update behavior is an added design decision)* <br><br> [A2] User has not completed the course: System does not prompt the user to leave a review and only displays reviews from other users |
| **Exceptions** | [E1] Database error on review submission: System displays "Failed to submit your review, please try again" and no review is stored |

---

## SC-007

| Field | Value |
|---|---|
| **Identifier** | SC-007 |
| **Name** | User Asks and Browses Q&A |
| **Related Requirements** | QNA-01, QNA-02, QNA-03, QNA-04, QNA-05 |
| **Actors** | User |
| **Pre-condition** | - User is enrolled in the course or has an Admin role <br> - Unauthenticated visitors and non-enrolled users cannot access Q&A |
| **Post-condition** | - New question is stored and linked to the selected lecture <br> - Question is visible to all enrolled users |
| **Trigger** | User opens the Q&A section of a course |
| **Main Flow** | **[Browse]** <br> 1. User enters the course <br> 2. User opens the Q&A section <br> 3. System lists all questions sorted by vote count descending, with top-voted answers and an upvote button per question <br><br> **[Search]** <br> 4. User searches for a question by keyword <br> 5. System displays all questions matching the search term with their answers <br><br> **[Ask]** <br> 6. User clicks "Ask a Question" <br> 7. User writes the question and selects the lecture it is related to <br> 8. User submits the question <br> 9. System displays the question publicly to all enrolled users in the course |
| **Alternative Flows** | [A1] No search results found: System displays "No results found" and prompts the user to ask a new question <br><br> [A2] User upvotes a question they already upvoted: System removes the upvote (toggle behavior) *(Note: extension beyond QNA-03 — toggle/un-upvote is an added design decision)* |
| **Exceptions** | [E1] Database error on question submission: System displays "Failed to submit your question, please try again" and the question is not stored |

---

## SC-008

| Field | Value |
|---|---|
| **Identifier** | SC-008 |
| **Name** | Admin Creates and Publishes a Course |
| **Related Requirements** | CRS-01, CRS-02, CRS-03, CRS-06, CRS-07, EXM-03, UAM-02, ADM-01 |
| **Actors** | Admin |
| **Pre-condition** | User must have an Admin role |
| **Post-condition** | - Course is stored in the system <br> - Course is listed as public or private based on Admin's selection <br> - Course content is accessible to enrolled users per CRS-04 |
| **Trigger** | Admin clicks "Add New Course" |
| **Main Flow** | 1. Admin clicks "Add New Course" <br> 2. Admin fills in course details: directors, accommodation details, start and end dates, and educational content overview <br> 3. Admin uploads course content: pre-test, video files (MP4, MOV, or AVI) through the platform interface, read-only documents, quizzes, and final exam <br> 4. Admin sets course availability status (public or private) and availability duration (days, weeks, months, years, or lifetime) <br> 5. Admin sets the number of allowed attempts per exam per course <br> 6. Admin publishes the course <br> 7. System lists the course based on its availability status |
| **Alternative Flows** | [A1] Admin saves course as draft: System stores the course without publishing it for further editing <br><br> [A2] Admin uploads unsupported video format: System rejects the file and displays "Video format [X] is not supported by the system" <br><br> [A3] Admin uploads video exceeding size limit: System rejects the file and displays "Video size exceeds limit, try compressing the video first" <br><br> [A4] Admin publishes course as private: System stores the course and hides it from unauthenticated and non-enrolled users |
| **Exceptions** | [E1] File upload fails due to server error: System displays "Upload failed, please try again" and no file is stored <br><br> [E2] Course save fails during publishing: System displays "Failed to publish course, please try again" and the course remains in draft state |

---

## SC-009

| Field | Value |
|---|---|
| **Identifier** | SC-009 |
| **Name** | Admin Monitors and Exports Reports |
| **Related Requirements** | ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06 |
| **Actors** | Admin |
| **Pre-condition** | User must have an Admin role |
| **Post-condition** | - Read-only interaction — no system state changes <br> - Generated report file is downloaded to Admin's device |
| **Trigger** | Admin opens the Admin Dashboard |
| **Main Flow** | **[Monitor]** <br> 1. Admin opens the dashboard <br> 2. System displays course names, number of enrolled users, total paid amount, and active/inactive status for each course <br> 3. Admin filters the dashboard by course, date, or completion status <br><br> **[Export]** <br> 4. Admin selects a specific course and exports a full data report showing enrolled users, their progress, exam scores for all attempts, and certificate status <br> 5. Admin exports a course ratings and reviews report for all courses at once or per course <br> 6. System generates and downloads the report as a CSV or Excel file |
| **Alternative Flows** | [A1] Non-Admin user attempts to access the dashboard: System returns a 403 Forbidden response <br><br> [A2] Admin exports a report for a course with no enrolled users: System prevents export and displays "No data available to export" <br><br> [A3] Admin applies filters but no results match: System displays "No results found" |
| **Exceptions** | [E1] Dashboard data fails to load: System displays a generic error message and logs the failure <br><br> [E2] Report export fails due to server error: System displays "Export failed, please try again" and no file is downloaded |

## 10. Preliminary Schedule

| Task ID | Task name | Dependencies | Start | End | Owner | Resources |
| ------- | --------- | ------------ | ----- | --- | ----- | --------- |
| T-001   |           |              |       |     |       |           |
| T-002   |           |              |       |     |       |           |
| T-003   |           |              |       |     |       |           |
| T-004   |           |              |       |     |       |           |
| T-005   |           |              |       |     |       |           |
| T-006   |           |              |       |     |       |           |
| T-007   |           |              |       |     |       |           |
| T-008   |           |              |       |     |       |           |

### 10.1 Gantt or PERT Chart

> _Insert schedule chart screenshot here._

**Figure 10-1.** Project schedule.

## 11. Preliminary Budget

| Cost factor     | Item | Quantity | Unit cost | Total |
| --------------- | ---- | -------- | --------- | ----- |
|                 |      |          |           |       |
|                 |      |          |           |       |
|                 |      |          |           |       |
|                 |      |          |           |       |
| **Grand total** |      |          |           |       |

## 12. Appendices

This section provides additional useful information for understanding the requirements of the Online Courses Platform.

### 12.1 Definitions, Acronyms, Abbreviations

| Term           | Definition                                                                              |
| -------------- | --------------------------------------------------------------------------------------- |
| MERN           | A development stack that includes MongoDB, Express.js, React.js, and Node.js.           |
| UI             | User Interface; the screens that users interact with in the system.                     |
| API            | Application Programming Interface; the connection between the frontend and backend.     |
| RBAC           | Role-Based Access Control; a method used to restrict system access based on user roles. |
| Dashboard      | A screen that displays important system data and management shortcuts.                  |
| Authentication | The process of verifying a user’s identity before allowing access to the system.        |
| Authorization  | The process of checking what an authenticated user is allowed to access.                |
| JWT            | JSON Web Token; a token used to manage authenticated user sessions.                     |
| MongoDB        | The database used to store platform data.                                               |
| Express.js     | The backend framework used to create API routes.                                        |
| React.js       | The frontend library used to build the user interface.                                  |
| Node.js        | The runtime environment used to run the backend server.                                 |
| System Log     | A record of important actions performed inside the system.                              |

### 12.2 Rich Picture

![Rich Picture](diagrams/Rich%20Picture.png)

**Figure 12-1.** Rich picture — system context and stakeholder relationships.

### 12.3 Collected Material

1. Client interview notes about the platform goals, user roles, course management, payments, exams, certificates, reports, and notifications.

2. Project documentation files, including the SRS document, functional requirements, non-functional requirements, operational scenarios, interface requirements, and performance requirements.

3. Project implementation materials, including frontend page screenshots, backend API route files, React routing files, and MERN project structure screenshots.

## 13. References

| Reference | Citation |
| --------- | -------- |
| [1]       |          |
| [2]       |          |
| [3]       |          |
