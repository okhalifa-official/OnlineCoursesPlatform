import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

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
  Reports,
  Notifications,
  Profile,
  EditAdminProfile,
  AdminRole,
} from "./pages";

import UserLogin    from "./user/pages/UserLogin";
import UserRegister from "./user/pages/UserRegister";
import UserHome     from "./user/pages/UserHome";
import UserProfile  from "./user/pages/UserProfile";
import LandingPage  from "./user/pages/LandingPage";
import CoursesPage  from "./user/pages/CoursesPage";
import WhyUsPage    from "./user/pages/WhyUsPage";

/* Scrolls to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* Adds fade-slide-in animation on every page mount */
function UserPage({ children }) {
  return <div className="page-enter">{children}</div>;
}

function PrivatePage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function PublicPage({ children }) {
  return <PublicRoute>{children}</PublicRoute>;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── User-facing public routes ── */}
        <Route path="/"        element={<UserPage><LandingPage  /></UserPage>} />
        <Route path="/courses" element={<UserPage><CoursesPage  /></UserPage>} />
        <Route path="/why-us"  element={<UserPage><WhyUsPage   /></UserPage>} />
        <Route path="/login"   element={<UserPage><UserLogin    /></UserPage>} />
        <Route path="/register"element={<UserPage><UserRegister /></UserPage>} />
        <Route path="/home"         element={<UserPage><UserHome     /></UserPage>} />
        <Route path="/user-profile" element={<UserPage><UserProfile  /></UserPage>} />

        {/* ── Admin routes ── */}
        <Route path="/admin/login" element={<PublicPage><Login /></PublicPage>} />

        <Route path="/dashboard"          element={<PrivatePage><AdminDashboard   /></PrivatePage>} />
        <Route path="/users"              element={<PrivatePage><Users            /></PrivatePage>} />
        <Route path="/users/add"          element={<PrivatePage><AddUser          /></PrivatePage>} />
        <Route path="/users/edit/:id"     element={<PrivatePage><EditUser         /></PrivatePage>} />
        <Route path="/approve-instructors"element={<PrivatePage><ApproveInstructors /></PrivatePage>} />
        <Route path="/admin/courses"      element={<PrivatePage><Courses          /></PrivatePage>} />
        <Route path="/admin/courses/add"  element={<PrivatePage><AddCourse        /></PrivatePage>} />
        <Route path="/admin/courses/edit/:id" element={<PrivatePage><EditCourse   /></PrivatePage>} />
        <Route path="/reports"            element={<PrivatePage><Reports          /></PrivatePage>} />
        <Route path="/profile"            element={<PrivatePage><Profile          /></PrivatePage>} />
        <Route path="/profile/edit"       element={<PrivatePage><EditAdminProfile /></PrivatePage>} />
        <Route path="/admin-role"         element={<PrivatePage><AdminRole        /></PrivatePage>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
