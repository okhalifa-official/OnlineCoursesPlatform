# Online Courses Platform

A full-stack web application for managing and delivering online courses, built for educational centers and their students.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 19, React Router, Tailwind CSS, Vite |
| Backend  | Node.js, Express                        |
| Database | MongoDB (Mongoose)                      |
| Auth     | JWT, bcryptjs                           |
| Email    | Nodemailer                              |
| Payments | Kashier Payment Gateway                 |

---

## User Roles

- **Super Admin** — full platform control
- **Admin** — manages courses, users, and center operations
- **Instructor** — creates and delivers course content
- **Student** — browses, enrolls in, and completes courses

---

## Features

### Student-Facing

- **Landing Page** — public homepage with platform info, mission/vision, partners, and policies
- **Course Catalog** — browse and search available courses
- **Course Detail** — view course overview, syllabus, and pricing before enrolling
- **Course Player** — watch lectures organized by modules
- **Exams** — take and review course exams upon completion
- **My Courses** — dashboard of enrolled and in-progress courses
- **Progress Tracking** — track completion across modules and lectures
- **Certificates** — download PDF certificates upon course completion
- **Certificate Verification** — public page to verify a certificate by ID
- **User Profile** — view and edit personal account details
- **Announcements** — receive platform-wide or course-specific announcements

### Admin Panel

- **Dashboard** — overview stats (users, courses, revenue, activity)
- **User Management** — add, edit, and manage students, instructors, and admins
- **Instructor Approval** — review and approve instructor registration requests
- **Course Management** — create, edit, and delete courses with module/lecture structure
- **Educational Centers** — manage affiliated educational centers and their admins
- **Payments** — view transaction history and configure payment gateway settings
- **Reports** — generate and export platform usage and financial reports
- **Announcements** — send bulk announcements to users or specific groups
- **Admin Roles** — define role-based access control for admin accounts
- **Permissions** — fine-grained permission management per user
- **Site Content** — edit dynamic public-facing page content
- **System Logs** — audit trail of all admin actions
- **Settings** — configure platform-wide system settings

### About / Institutional Pages

- Mission & Vision
- Board of Directors
- MENA Board
- Scientific Committee
- Clinical Advisors
- Business Partners
- Scientific Partners
- Policies

---

## Project Structure

```
OnlineCoursesPlatform/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── admin/           # Admin panel pages and components
│   │   └── user/            # Student-facing pages and components
│   └── public/
│       └── data/            # XML files for static institutional content
└── server/                  # Express backend
    ├── Controllers/          # Business logic
    ├── Routers/              # API route definitions
    ├── Models/               # Mongoose data models
    ├── middleware/           # Auth and audit middleware
    ├── services/             # External service integrations (Kashier)
    └── utils/                # Helpers (email, etc.)
```

---

## Key Data Models

| Model              | Description                                      |
|--------------------|--------------------------------------------------|
| User / Student     | Platform accounts and student-specific data      |
| Admin / AdminRole  | Admin accounts with role-based permissions       |
| Instructor         | Instructor profiles pending or approved          |
| Course             | Course metadata, modules, and lectures           |
| Lecture            | Individual lecture content within a course       |
| Enrollment         | Student–course enrollment records                |
| Progress           | Per-lecture and per-module completion tracking   |
| Exam / ExamAttempt | Course exam questions and student attempts       |
| Certificate        | Issued certificates with verification support    |
| Payment / Transaction | Payment records and Kashier integration       |
| EducationalCenter  | Affiliated centers and their center admins       |
| Announcement       | Bulk notifications to users                      |
| SystemLog          | Audit log of admin activity                      |
| SupportRequest     | Help/support ticket submissions                  |
| PageContent        | Editable content for public-facing pages         |
