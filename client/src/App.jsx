import { Routes, Route, Navigate } from "react-router-dom";

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
  Profile,
  EditAdminProfile,
  AdminRole,
} from "./pages";

function PrivatePage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function PublicPage({ children }) {
  return <PublicRoute>{children}</PublicRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicPage>
            <Login />
          </PublicPage>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/dashboard"
        element={
          <PrivatePage>
            <AdminDashboard />
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
        path="/approve-instructors"
        element={
          <PrivatePage>
            <ApproveInstructors />
          </PrivatePage>
        }
      />

      <Route
        path="/courses"
        element={
          <PrivatePage>
            <Courses />
          </PrivatePage>
        }
      />

      <Route
        path="/courses/add"
        element={
          <PrivatePage>
            <AddCourse />
          </PrivatePage>
        }
      />

      <Route
        path="/courses/edit/:id"
        element={
          <PrivatePage>
            <EditCourse />
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

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}