import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserToken, clearUserToken, getUserInfo } from "../api/userApi";
import UserNavbar from "../components/UserNavbar";
import UserSidebar from "../components/UserSidebar";

const NAV_LINKS = [
  { label: "Home",    to: "/",         section: null      },
  { label: "Courses", to: "/courses",  section: null      },
  { label: "Contact", to: "/#contact", section: "contact" },
];

const SIDEBAR_LINKS = [
  {
    label: "Dashboard",
    to: "/home",
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>,
  },
  {
    label: "My Courses",
    to: "/my-courses",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    label: "Certificates",
    to: "/home",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
  {
    label: "Profile",
    to: "/user-profile",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
];

/**
 * /home — Empty Dashboard landing for the My Learning area.
 *
 * Course-related content lives on the dedicated /my-courses route — this page
 * is intentionally empty for now and just welcomes the user. The sidebar still
 * shows so they can navigate to My Courses.
 */
export default function UserHome() {
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/register", { replace: true });
    }
  }, [navigate]);

  function handleLogout() {
    clearUserToken();
    navigate("/login");
  }

  const firstName = userInfo?.fullName?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="min-h-screen bg-softGrey">
      <UserNavbar links={NAV_LINKS} />

      <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
        <UserSidebar
          links={SIDEBAR_LINKS}
          activeLink="Dashboard"
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col min-h-screen">
          <div className="sticky top-14 z-10 bg-softGrey border-b border-gray-200 px-8 py-4">
            <p className="text-sm text-gray-400">
              Home / <span className="text-charcoal font-medium">Dashboard</span>
            </p>
          </div>

          <div className="flex-1 p-8">
            <div className="mb-8">
              <p className="text-brandRed font-semibold text-xs tracking-[0.2em] uppercase mb-1">
                Welcome back
              </p>
              <h1
                className="font-heading font-bold text-charcoal mb-1"
                style={{ fontSize: "1.875rem" }}
              >
                Hi, {firstName} 👋
              </h1>
              <p className="text-gray-400 text-sm">
                Your dashboard is empty for now. Head over to My Courses to continue learning.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-softGrey flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-heading font-semibold text-charcoal mb-1">
                Nothing to show yet.
              </p>
              <p className="text-gray-400 text-sm">
                Use the sidebar to jump into My Courses or browse the catalogue.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
