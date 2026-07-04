# SonoSchool — DeepMinds 7th Edition Poster Content

> Ready-to-paste content for the DeepMinds Graduation Project Showcase poster.
> Fields in `[ brackets ]` are personal — fill them in before printing.

---

## Project Title
**SonoSchool — Full-Stack E-Learning Platform for Medical Education**

## One-line Description
A complete online learning platform — course browsing, secure payments, video/PDF delivery, exams, and verified certificates — built for Egyptian medical students, with an AI-assisted admin review that explains every payment before it reaches human hands.

## Presented By
- [ Your Name ] · ID [ 0000000 ]
- [ Teammate Name ] · ID [ 0000000 ]
- [ Teammate Name ] · ID [ 0000000 ]
- [ Teammate Name ] · ID [ 0000000 ]
- [ Teammate Name ] · ID [ 0000000 ]

## Supervised By
[ Supervisor Name ]

## Project Code
CS-[ 000 ] · Spring 2026

---

## 01 · Abstract
SonoSchool is an end-to-end e-learning platform for the Egyptian medical-training market. It covers the full student journey — account registration, course discovery, secure paid enrollment, video lectures, downloadable PDFs, timed exams with attempt tracking, and verifiable digital certificates — alongside a comprehensive admin dashboard for course authoring, enrollment management, payment review, site-wide content editing, and user administration. The platform integrates two payment channels (Kashier card gateway and manual InstaPay bank transfer) plus an **AI-assisted admin-review module**: a vision-language model reads every InstaPay screenshot, extracts the amount, recipient, timestamp, and reference number, and generates **plain-language reasons** for each submission — flagging exactly what is wrong (e.g. *"amount does not match course price"* or *"recipient must be 01155444202"*) or confirming everything looks correct. The admin sees the screenshot alongside a machine-readable summary and a one-click approve / reject action, turning payment reconciliation from a multi-minute manual task into a few seconds of oversight.

---

## 02 · Objectives *(replaces "Aim of the Work")*
- **Product:** Deliver a complete e-learning platform covering discovery → purchase → learning → assessment → certification.
- **Operations:** Give admins a single dashboard for courses, students, payments, content, and system logs.
- **AI-assisted review:** Extract structured data from every InstaPay screenshot and surface machine-generated reasons so admins can approve or reject in one click, without opening a bank statement.

---

## 03 · Feature Set *(replaces "Dataset")*
Instead of a training corpus, the project's "scale" is the breadth of the product itself.

| **40+** | **06** | **02** |
|:---:|:---:|:---:|
| FEATURES | DOMAINS | ROLES |
| across student + admin | Courses · Payments · Exams · Certificates · Content · Users | Student · Admin, with granular permissions |

---

## 04 · Tech Stack *(replaces "Used Tools")*
React (Vite) · Tailwind CSS · Node.js · Express · MongoDB Atlas · Mongoose · JWT · Bcrypt · Nodemailer · Groq (Llama 4 Scout Vision) · Kashier Gateway · Axios · React Router · React Quill · jsPDF

---

## 05 · Engineering Pipeline *(replaces "Methodology")*

**01 · Discover** — User research and flow mapping for medical students and admins; scope every screen from landing page to certificate download.

**02 · Architect** — MERN stack with modular routers, role-based JWT auth, and a gateway-agnostic payment layer.

**03 · Build** — Implement student portal, admin dashboard, payment gateways, exam engine, certificate generation, secure PDF viewer, and the AI review pipeline (screenshot → JSON extraction → rule-based reason generation).

**04 · Validate** — End-to-end testing across enrollment, learning, exam, certification, and both payment paths; verify the AI produces correct reasons for genuine, wrong-amount, and wrong-recipient submissions.

---

## 06 · System Overview
Three-tier architecture:

- **Client (React + Vite)** — student portal (dashboard, courses, learning, exam, certificates, payment, notifications) + admin dashboard (courses, students, payments, reports, site content, system logs, permissions).
- **API (Node.js + Express)** — auth, users, courses, enrollments, lectures, exams, payments, notifications, page content, system logs, support requests, admin permissions.
- **Data (MongoDB Atlas)** — Users, Courses, Enrollments, Payments, PaymentTransactions, Notifications, PageContent, SystemLogs, Announcements.
- **AI review pipeline** — screenshot upload → Groq Llama 4 Scout vision → structured JSON → rule engine → human-readable reasons → admin dashboard.
- **External services** — Kashier payment gateway, Groq API (vision), Gmail SMTP, jsPDF certificate rendering.

---

## 07 · Highlights & Metrics *(replaces "Results & Evaluation")*

| **~5s** | **1-click** | **100%** |
|:---:|:---:|:---:|
| AI EXTRACTION TIME | ADMIN DECISION | SUBMISSIONS EXPLAINED |
| screenshot → structured summary via Groq vision | approve or reject with pre-populated context | every payment reaches the admin with reasons attached |

**What the admin sees for every submission:**
- The student's screenshot (in-place, no bank statement lookup)
- The extracted fields — amount, recipient, timestamp, reference number
- Clear reason lines — e.g. *"Amount 30 EGP does not match course price 50 EGP"* or *"Recipient must be 01155444202"* — or a green "all checks passed" summary

---

## 08 · Conclusion
SonoSchool proves that a small team can deliver a full, production-grade e-learning platform — from public marketing site to authenticated learning experience to admin back office — while integrating modern AI services meaningfully rather than as a gimmick. The AI does not replace the admin; it **prepares every decision** by extracting the data and stating the reasons up front, so a human retains final authority while the busywork disappears. The project demonstrates end-to-end mastery of full-stack web development, third-party API integration, security (auth, permissions, audit logs), and applied AI, and it is directly usable by Egyptian medical educators today.

---

## 09 · Future Work
- **More payment rails** — Fawry Pay, Vodafone Cash, Meeza wallets, each with its own set of extraction rules and reasons.
- **Full auto-approval mode** — after enough admin-approved samples, promote high-confidence submissions to instant enrollment.
- **AI tutor & auto-graded assignments** — RAG over lecture PDFs; automated grading of open-response exam answers.
- **Mobile app + hosted deployment** — React Native clients and a production deployment (CDN, hosted backend, monitoring).

---

## Footer

- **Publishing / venue:** DeepMinds 7th Edition — Graduation Project Showcase, MSA University
- **Contact:** [ your team email ]
