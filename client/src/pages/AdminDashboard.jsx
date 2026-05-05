import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getDashboardOverview,
  getNotifications,
  getRecentActivity,
  getAlerts,
  getPerformance,
} from "../api/dashboardApi";

import { logoutAdmin } from "../api/authApi";
import { getAdminProfile } from "../api/adminApi";

export default function AdminDashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    logoutAdmin();
    navigate("/login", { replace: true });
  }

  const [overview, setOverview] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    async function fetchDashboardData() {
      try {
        const [
          overviewData,
          notificationsData,
          activityData,
          alertsData,
          performanceData,
          adminData,
        ] = await Promise.all([
          getDashboardOverview(),
          getNotifications(),
          getRecentActivity(),
          getAlerts(),
          getPerformance(),
          getAdminProfile(),
        ]);

        setOverview(overviewData);
        setNotifications(notificationsData);
        setRecentActivity(activityData);
        setAlerts(alertsData);
        setPerformance(performanceData);
        setAdmin(adminData);
      } catch (error) {
        console.error("Dashboard API Error:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F2]">
        <p className="text-[#1A1A1A] font-bold">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F2F2F2] text-[#1A1A1A] font-body">
      <aside className="w-72 bg-[#1A1A1A] text-white flex flex-col px-6 py-7 shadow-[0_8px_24px_rgba(26,26,26,0.08)]">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-white/60 heading-font">
            Admin View
          </p>
        </div>

        <nav className="space-y-2">
          <SidebarLink to="/educational-centers" icon="home" text="Educational Centers" />
          <SidebarLink to="/dashboard" icon="dashboard" text="Dashboard" active />
          <SidebarLink to="/users" icon="group" text="Users" />
          <SidebarLink to="/courses" icon="menu_book" text="Courses" />
          <SidebarLink to="/payments" icon="payments" text="Payments" />
          <SidebarLink to="/reports" icon="bar_chart" text="Reports" />
          <SidebarLink to="/settings" icon="settings" text="Settings" />
          <SidebarLink to="/logs" icon="receipt_long" text="Log" />
        </nav>

        <div className="mt-auto rounded-2xl bg-white/5 p-4 border border-white/10">
          <p className="text-xs text-white/60 mb-2">Switch Mode</p>

          <button className="w-full rounded-xl bg-white text-[#1A1A1A] py-3 text-sm font-semibold heading-font hover:bg-[#F2F2F2] transition">
            End User View
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-xl bg-[#D62828] text-white py-3 text-sm font-semibold heading-font hover:bg-[#B92323] transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8">
        <header className="mb-8 flex items-center justify-between rounded-3xl bg-white px-6 py-4 shadow-card card-border">
          <div className="flex items-center gap-5">
            <div className="h-12 w-auto flex items-center">
              <img src="/logo.png" className="h-full object-contain" />
            </div>

            <p className="text-sm text-[#333333] opacity-70 leading-none">
              Overview of platform performance and daily admin operations
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative h-12 w-12 rounded-full bg-[#F2F2F2] text-[#1A1A1A] hover:bg-[#e8e8e8] transition flex items-center justify-center"
                type="button"
              >
                <span className="material-symbols-outlined">
                  notifications
                </span>

                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#D62828] border-2 border-white"></span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-[56px] w-[360px] bg-white rounded-2xl border border-[#E5E5E5] shadow-[0_12px_35px_rgba(0,0,0,0.12)] overflow-hidden z-[100]">
                  <div className="px-5 py-4 border-b border-[#EEEEEE] bg-[#fafafa]">
                    <h3 className="text-[16px] font-bold text-[#1A1A1A] heading-font">
                      Notifications
                    </h3>
                    <p className="text-[12px] text-[#666]">
                      You have {notifications.length} unread notifications
                    </p>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto">
                    {notifications.map((item) => (
                      <Link
                        to={item.link}
                        key={item.id}
                        className="flex gap-3 px-5 py-4 border-b border-[#F1F1F1] hover:bg-[#fafafa] transition"
                      >
                        <div className="h-10 w-10 rounded-full bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {item.icon}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold heading-font text-[#1A1A1A]">
                            {item.title}
                          </p>
                          <p className="text-xs text-[#333333]/70">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-[#EEEEEE] bg-[#fafafa]">
                    <Link
                      to="/notifications"
                      className="w-full h-10 rounded-xl bg-[#D62828] text-white text-sm font-bold heading-font flex items-center justify-center hover:opacity-95 transition"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm heading-font font-semibold text-[#1A1A1A]">
                  {admin?.firstName} {admin?.lastName}
                </p>
                <p className="text-xs text-[#333333]">
                  {admin?.jobTitle || "System Administrator"}
                </p>
              </div>

              {admin?.image ? (
                <img
                  src={admin.image}
                  alt="Admin Profile"
                  className="h-12 w-12 rounded-full object-cover border border-[#E5E5E5]"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-[#D62828] text-white hover:opacity-90 transition flex items-center justify-center">
                  <span className="material-symbols-outlined">person</span>
                </div>
              )}
            </Link>
          </div>
        </header>

        <section className="mb-8">
          <p className="mb-4 text-sm font-semibold text-[#333333]/70 heading-font">
            System Overview
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
            <KpiCard
              icon="groups"
              label="Total Users"
              value={overview?.totalUsers}
              badge="+12%"
              red
            />

            <KpiCard
              icon="bolt"
              label="Active Users"
              value={overview?.activeUsers}
              badge="+4.2%"
            />

            <KpiCard
              icon="library_books"
              label="Total Courses"
              value={overview?.totalCourses}
              badge="New"
              red
            />

            <KpiCard
              icon="payments"
              label="Revenue"
              value={overview?.revenue}
              badge="+28%"
            />

            <KpiCard
              icon="person_add"
              label="New Signups"
              value={overview?.newSignups}
              badge="+9%"
              red
            />

            <KpiCard
              icon="task_alt"
              label="Completion Rate"
              value={overview?.completionRate}
              badge="+6%"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
          <div className="xl:col-span-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ActionCard
                icon="post_add"
                title="Add Course"
                link="/courses/add"
              />

              <ActionCard
                icon="person_add"
                title="Add User"
                link="/users/add"
              />

              <ActionCard
                icon="verified"
                title="Approve Instructor"
                link="/approve-instructors"
                red
              />

              <ActionCard
                icon="analytics"
                title="View Reports"
                link="/reports"
              />
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold text-[#333333]/70 heading-font">
                Recent Activity
              </p>

              <div className="rounded-3xl bg-white shadow-card card-border overflow-hidden">
                <div className="divide-y divide-[#3333331f]">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            item.color === "red"
                              ? "bg-red-50 text-[#D62828]"
                              : "bg-[#F2F2F2] text-[#1A1A1A]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {item.icon}
                          </span>
                        </div>

                        <div>
                          <p className="font-semibold text-sm heading-font">
                            {item.title}
                          </p>
                          <p className="text-xs text-[#333333]/70">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-[#333333]/70 font-medium">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4">
            <p className="mb-4 text-sm font-semibold text-[#333333]/70 heading-font">
              Alerts / Issues
            </p>

            <div className="rounded-3xl bg-[#1A1A1A] text-white shadow-card p-6 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-11 w-11 rounded-2xl bg-red-50 text-[#D62828] flex items-center justify-center">
                  <span className="material-symbols-outlined">warning</span>
                </div>

                <div>
                  <h3 className="font-bold text-lg heading-font">
                    System Alerts
                  </h3>
                  <p className="text-sm text-white/60">
                    Items that require admin review
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <AlertRow
                  title="Failed payments"
                  value={alerts?.failedPayments ?? 0}
                  red
                />

                <AlertRow
                  title="Reported users"
                  value={alerts?.reportedUsers ?? 0}
                />

                <AlertRow
                  title="Pending approvals"
                  value={alerts?.pendingApprovals ?? 0}
                />

                <AlertRow
                  title="System errors"
                  value={alerts?.systemErrors ?? 0}
                  danger
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4">
          <p className="mb-4 text-sm font-semibold text-[#333333]/70 heading-font">
            Performance Overview
          </p>

          <div className="rounded-3xl bg-white shadow-card card-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <PerformanceCard
                icon="trending_up"
                title="User Growth"
                description="Monthly increase in total active registrations"
                badge={performance?.userGrowth}
                type="bars"
                red
              />

              <PerformanceCard
                icon="auto_graph"
                title="Course Engagement"
                description="Student participation and content interaction level"
                badge={performance?.courseEngagement}
                type="circle"
              />

              <PerformanceCard
                icon="payments"
                title="Revenue Trend"
                description="Financial performance across current reporting period"
                badge={performance?.revenueTrend}
                type="line"
                red
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, text, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
        active
          ? "bg-[#D62828] font-semibold shadow-md text-white heading-font"
          : "font-medium text-white/70 hover:bg-white/5"
      }`}
    >
      <span className="material-symbols-outlined text-[20px] text-white">
        {icon}
      </span>
      {text}
    </Link>
  );
}

function KpiCard({ icon, label, value, badge, red }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card card-border">
      <div className="flex items-center justify-between mb-4">
        <span
          className={`material-symbols-outlined ${
            red ? "text-[#D62828]" : "text-[#1A1A1A]"
          }`}
        >
          {icon}
        </span>

        <span
          className={`text-xs font-bold px-2 py-1 rounded-full heading-font ${
            red ? "text-[#D62828] bg-red-50" : "text-[#1A1A1A] bg-[#F2F2F2]"
          }`}
        >
          {badge}
        </span>
      </div>

      <p className="text-sm text-[#333333]/70">{label}</p>
      <h3 className="mt-2 text-2xl font-extrabold heading-font">
        {value ?? "-"}
      </h3>
    </div>
  );
}

function ActionCard({ icon, title, link, red }) {
  return (
    <Link
      to={link}
      className="group rounded-2xl bg-white p-5 text-left shadow-card card-border transition hover:bg-[#D62828] hover:text-white"
    >
      <span
        className={`material-symbols-outlined mb-3 group-hover:text-white ${
          red ? "text-[#D62828]" : "text-[#1A1A1A]"
        }`}
      >
        {icon}
      </span>

      <p className="font-bold heading-font">{title}</p>
    </Link>
  );
}

function AlertRow({ title, value, red, danger }) {
  if (danger) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-[#1A1A1A]">{title}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-[#D62828] text-white heading-font">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between">
      <span className="text-sm">{title}</span>
      <span
        className={`text-xs px-2 py-1 rounded-full heading-font ${
          red ? "bg-red-50 text-[#D62828]" : "bg-[#F2F2F2] text-[#1A1A1A]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PerformanceCard({ icon, title, description, badge, type, red }) {
  return (
    <div className="rounded-3xl border border-[#3333331f] bg-white p-6">
      <div className="flex items-center justify-between mb-5">
        <span
          className={`material-symbols-outlined ${
            red ? "text-[#D62828]" : "text-[#1A1A1A]"
          }`}
        >
          {icon}
        </span>

        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full heading-font ${
            red ? "text-[#D62828] bg-red-50" : "text-[#1A1A1A] bg-[#F2F2F2]"
          }`}
        >
          {badge ?? "0%"}
        </span>
      </div>

      <h4 className="font-bold text-lg mb-2 heading-font">{title}</h4>
      <p className="text-sm text-[#333333]/70 mb-5">{description}</p>

      {type === "bars" && (
        <div className="flex items-end gap-2 h-20">
          <div className="w-6 bg-[#d6282830] rounded-t-md h-8"></div>
          <div className="w-6 bg-[#d6282845] rounded-t-md h-10"></div>
          <div className="w-6 bg-[#d6282860] rounded-t-md h-12"></div>
          <div className="w-6 bg-[#d6282880] rounded-t-md h-16"></div>
          <div className="w-6 bg-[#D62828] rounded-t-md h-20"></div>
        </div>
      )}

      {type === "circle" && (
        <div className="w-24 h-24 mx-auto rounded-full border-[10px] border-[#F2F2F2] border-t-[#D62828] rotate-45"></div>
      )}

      {type === "line" && (
        <div className="relative h-20">
          <div className="absolute inset-x-0 bottom-4 h-[2px] bg-[#3333331f]"></div>
          <svg viewBox="0 0 240 80" className="w-full h-full">
            <path
              d="M10 60 C40 55, 60 45, 90 48 C120 51, 135 20, 170 28 C195 34, 210 18, 230 10"
              fill="none"
              stroke="#D62828"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}