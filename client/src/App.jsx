import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import ProtectedRoute from "./admin/components/ProtectedRoute";

import {
  Login,
  AdminDashboard,
  Users,
  AddUser,
  EditUser,
  ApproveInstructors,
  Courses,
  AddCourse,
  EditCourse,
  CourseStudents,
  Reports,
  Notifications,
  Profile,
  EditAdminProfile,
  AdminRole,
  EducationalCenters,
  AddEducationalCenter,
  EditEducationalCenter,
  EducationalCenterProfile,
  SystemLogs,
  Payments,
  SiteContent,
  PaymentSettings,
  StudentPermissions,
  AdminPermissions,
  Help,
  Settings,
  BulkAnnouncements,
} from "./admin/pages";

import {
  UserRegister,
  UserHome,
  UserProfile,
  LandingPage,
  CoursesPage,
  CourseDetail,
  CourseView,
  LectureView,
  MyCourses,
  ExamView,
  UserLogin,
  Certificates,
  VerifyCertificate,
} from "./user/index";

import MissionVision from "./user/pages/about-us/MissionVision";
import BoardOfDirectors from "./user/pages/about-us/BoardOfDirectors";
import MENABoard from "./user/pages/about-us/MENABoard";
import ScientificCommittee from "./user/pages/about-us/ScientificCommittee";
import ClinicalAdvisors from "./user/pages/about-us/ClinicalAdvisors";
import BusinessPartners from "./user/pages/about-us/BusinessPartners";
import ScientificPartners from "./user/pages/about-us/ScientificPartners";
import Policies from "./user/pages/about-us/Policies";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Give the page a tick to render before scrolling to the anchor.
      const id = hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function UserPage({ children }) {
  return <div className="page-enter">{children}</div>;
}

function PrivatePage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ── User-facing public routes ── */}
        <Route path="/"             element={<UserPage><LandingPage  /></UserPage>} />
        <Route path="/courses"      element={<UserPage><CoursesPage  /></UserPage>} />
        <Route path="/courses/:id"  element={<UserPage><CourseDetail /></UserPage>} />
        <Route path="/learn/:id"    element={<UserPage><CourseView   /></UserPage>} />
        <Route path="/learn/:id/lecture/:mi/:li" element={<UserPage><LectureView /></UserPage>} />
        <Route path="/learn/:id/exam" element={<UserPage><ExamView /></UserPage>} />
        <Route path="/learn/:id/exam/review" element={<UserPage><ExamView /></UserPage>} />
        <Route path="/login"        element={<UserPage><UserLogin    /></UserPage>} />
        <Route path="/register"     element={<UserPage><UserRegister /></UserPage>} />
        <Route path="/home"         element={<UserPage><UserHome     /></UserPage>} />
        <Route path="/my-courses"    element={<UserPage><MyCourses    /></UserPage>} />
        <Route path="/certificates" element={<UserPage><Certificates /></UserPage>} />
        <Route path="/verify"       element={<UserPage><VerifyCertificate /></UserPage>} />
        <Route path="/user-profile" element={<UserPage><UserProfile  /></UserPage>} />

        {/* ── About-us pages ── */}
        <Route
          path="/about/mission-vision"
          element={
            <UserPage>
              <MissionVision />
            </UserPage>
          }
        />
        <Route
          path="/about/board-of-directors"
          element={
            <UserPage>
              <BoardOfDirectors />
            </UserPage>
          }
        />
        <Route
          path="/about/mena-board"
          element={
            <UserPage>
              <MENABoard />
            </UserPage>
          }
        />
        <Route
          path="/about/scientific-committee"
          element={
            <UserPage>
              <ScientificCommittee />
            </UserPage>
          }
        />
        <Route
          path="/about/clinical-advisors"
          element={
            <UserPage>
              <ClinicalAdvisors />
            </UserPage>
          }
        />
        <Route
          path="/about/business-partners"
          element={
            <UserPage>
              <BusinessPartners />
            </UserPage>
          }
        />
        <Route
          path="/about/scientific-partners"
          element={
            <UserPage>
              <ScientificPartners />
            </UserPage>
          }
        />
        <Route
          path="/about/policies"
          element={
            <UserPage>
              <Policies />
            </UserPage>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivatePage>
              <AdminDashboard />
            </PrivatePage>
          }
        />
        <Route
          path="/site-content"
          element={
            <PrivatePage>
              <SiteContent />
            </PrivatePage>
          }
        />
        <Route
          path="/educational-centers"
          element={
            <PrivatePage>
              <EducationalCenters />
            </PrivatePage>
          }
        />
        <Route
          path="/educational-centers/add"
          element={
            <PrivatePage>
              <AddEducationalCenter />
            </PrivatePage>
          }
        />
        <Route
          path="/educational-centers/edit/:id"
          element={
            <PrivatePage>
              <EditEducationalCenter />
            </PrivatePage>
          }
        />
        <Route
          path="/educational-centers/:id"
          element={
            <PrivatePage>
              <EducationalCenterProfile />
            </PrivatePage>
          }
        />

        <Route
          path="/users"
          element={
            <PrivatePage>
              <Users />
            </PrivatePage>
          }
        />
        <Route
          path="/users/add"
          element={
            <PrivatePage>
              <AddUser />
            </PrivatePage>
          }
        />
        <Route
          path="/users/edit/:id"
          element={
            <PrivatePage>
              <EditUser />
            </PrivatePage>
          }
        />
        <Route
          path="/users/:id/permissions"
          element={
            <PrivatePage>
              <StudentPermissions />
            </PrivatePage>
          }
        />
        <Route
          path="/users/:id/admin-permissions"
          element={
            <PrivatePage>
              <AdminPermissions />
            </PrivatePage>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <PrivatePage>
              <Courses />
            </PrivatePage>
          }
        />
        <Route
          path="/admin/courses/add"
          element={
            <PrivatePage>
              <AddCourse />
            </PrivatePage>
          }
        />
        <Route
          path="/admin/courses/edit/:id"
          element={
            <PrivatePage>
              <EditCourse />
            </PrivatePage>
          }
        />
        <Route
          path="/admin/courses/:id/students"
          element={
            <PrivatePage>
              <CourseStudents />
            </PrivatePage>
          }
        />

        <Route
          path="/payments"
          element={
            <PrivatePage>
              <Payments />
            </PrivatePage>
          }
        />
        <Route
          path="/payments/settings"
          element={
            <PrivatePage>
              <PaymentSettings />
            </PrivatePage>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivatePage>
              <Settings />
            </PrivatePage>
          }
        />
        <Route
          path="/help"
          element={
            <PrivatePage>
              <Help />
            </PrivatePage>
          }
        />
        <Route
          path="/approve-instructors"
          element={
            <PrivatePage>
              <ApproveInstructors />
            </PrivatePage>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivatePage>
              <Reports />
            </PrivatePage>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivatePage>
              <Notifications />
            </PrivatePage>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivatePage>
              <Profile />
            </PrivatePage>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <PrivatePage>
              <EditAdminProfile />
            </PrivatePage>
          }
        />
        <Route
          path="/admin-role"
          element={
            <PrivatePage>
              <AdminRole />
            </PrivatePage>
          }
        />
        <Route
          path="/logs"
          element={
            <PrivatePage>
              <SystemLogs />
            </PrivatePage>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
