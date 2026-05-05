import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getReportsOverview } from "../api/reportsApi";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      const data = await getReportsOverview();
      setReport(data);
    } catch (error) {
      alert(error.message);
      console.error("Reports error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadReports();
  }, []);

  const maxRoleValue = useMemo(function () {
    if (!report) return 1;

    return Math.max(...report.roleDistribution.map((item) => item.value), 1);
  }, [report]);

  const maxCourseStatusValue = useMemo(function () {
    if (!report) return 1;

    return Math.max(
      ...report.courseStatusDistribution.map((item) => item.value),
      1
    );
  }, [report]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="font-bold text-[#1A1A1A]">Loading reports...</p>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="font-bold text-[#1A1A1A]">No report data found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
            Platform Reports
          </p>
          <h1 className="text-4xl font-extrabold heading-font">
            Reports Overview
          </h1>
          <p className="text-[#333333]/70 mt-2">
            Performance insights based on users, instructors, courses, revenue,
            and completion data.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl bg-[#1A1A1A] text-white px-5 py-3 text-sm font-bold heading-font"
          >
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={loadReports}
            className="rounded-xl bg-[#D62828] text-white px-5 py-3 text-sm font-bold heading-font"
          >
            Refresh Reports
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <ReportCard
          icon="groups"
          title="Total Users"
          value={report.summary.totalUsers}
          note={`${report.summary.activeUsers} active users`}
          red
        />

        <ReportCard
          icon="school"
          title="Total Courses"
          value={report.summary.totalCourses}
          note={`${report.summary.publishedCourses} published courses`}
        />

        <ReportCard
          icon="payments"
          title="Total Revenue"
          value={`$${Number(report.summary.totalRevenue).toLocaleString()}`}
          note="Calculated from price × active students"
          red
        />

        <ReportCard
          icon="task_alt"
          title="Avg. Completion"
          value={`${report.summary.avgCompletion}%`}
          note={`${report.summary.openTickets} open tickets`}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <MiniCard title="Students" value={report.summary.students} />
        <MiniCard title="Instructors" value={report.summary.instructors} />
        <MiniCard title="Admins" value={report.summary.admins} />
        <MiniCard
          title="Pending Instructors"
          value={report.summary.pendingInstructors}
          warning
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        <div className="xl:col-span-6 rounded-3xl bg-white shadow-card card-border p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#333333]/70 heading-font">
              User Analytics
            </p>
            <h2 className="text-2xl font-bold heading-font mt-1">
              Role Distribution
            </h2>
          </div>

          <div className="space-y-5">
            {report.roleDistribution.map((item) => (
              <BarRow
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={maxRoleValue}
              />
            ))}
          </div>
        </div>

        <div className="xl:col-span-6 rounded-3xl bg-white shadow-card card-border p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#333333]/70 heading-font">
              Course Analytics
            </p>
            <h2 className="text-2xl font-bold heading-font mt-1">
              Course Status Distribution
            </h2>
          </div>

          <div className="space-y-5">
            {report.courseStatusDistribution.map((item) => (
              <BarRow
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={maxCourseStatusValue}
                dark
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        <div className="xl:col-span-7 rounded-3xl bg-white shadow-card card-border overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E5E5]">
            <p className="text-sm font-semibold text-[#333333]/70 heading-font">
              Revenue
            </p>
            <h2 className="text-2xl font-bold heading-font mt-1">
              Top Performing Courses
            </h2>
          </div>

          <table className="w-full text-left">
            <thead className="bg-[#1A1A1A] text-white">
              <tr>
                <th className="px-5 py-4 text-sm">Course</th>
                <th className="px-5 py-4 text-sm">Students</th>
                <th className="px-5 py-4 text-sm">Revenue</th>
                <th className="px-5 py-4 text-sm">Completion</th>
              </tr>
            </thead>

            <tbody>
              {report.topCourses.map((course) => (
                <tr key={course._id} className="border-b border-[#eee]">
                  <td className="px-5 py-4 text-sm font-semibold">
                    {course.courseName}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {course.activeStudents}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-[#D62828]">
                    ${Number(course.revenue).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {course.completionRate}%
                  </td>
                </tr>
              ))}

              {report.topCourses.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-[#333333]/70">
                    No course revenue data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="xl:col-span-5 rounded-3xl bg-[#1A1A1A] text-white shadow-card p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-white/60 heading-font">
              Risk Signals
            </p>
            <h2 className="text-2xl font-bold heading-font mt-1">
              Needs Attention
            </h2>
          </div>

          <div className="space-y-4">
            <AlertRow
              title="Pending instructor approvals"
              value={report.summary.pendingInstructors}
              link="/approve-instructors"
            />

            <AlertRow
              title="Suspended users"
              value={report.summary.suspendedUsers}
              link="/users"
            />

            <AlertRow
              title="Open course tickets"
              value={report.summary.openTickets}
              link="/courses"
            />

            <AlertRow
              title="Draft courses"
              value={report.summary.draftCourses}
              link="/courses"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6 rounded-3xl bg-white shadow-card card-border overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E5E5]">
            <p className="text-sm font-semibold text-[#333333]/70 heading-font">
              Recent Activity
            </p>
            <h2 className="text-2xl font-bold heading-font mt-1">
              Latest Users
            </h2>
          </div>

          <div className="divide-y divide-[#eee]">
            {report.recentUsers.map((user) => (
              <div key={user._id} className="px-6 py-4 flex justify-between gap-4">
                <div>
                  <p className="text-sm font-bold heading-font">
                    {user.fullName || user.name || user.email}
                  </p>
                  <p className="text-xs text-[#333333]/70">
                    {user.email}
                  </p>
                </div>

                <span className="text-xs rounded-full bg-[#F2F2F2] px-3 py-1 h-fit capitalize">
                  {user.role}
                </span>
              </div>
            ))}

            {report.recentUsers.length === 0 && (
              <div className="px-6 py-8 text-center text-[#333333]/70">
                No users yet.
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-6 rounded-3xl bg-white shadow-card card-border overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E5E5]">
            <p className="text-sm font-semibold text-[#333333]/70 heading-font">
              Recent Activity
            </p>
            <h2 className="text-2xl font-bold heading-font mt-1">
              Latest Courses
            </h2>
          </div>

          <div className="divide-y divide-[#eee]">
            {report.recentCourses.map((course) => (
              <div key={course._id} className="px-6 py-4 flex justify-between gap-4">
                <div>
                  <p className="text-sm font-bold heading-font">
                    {course.courseName}
                  </p>
                  <p className="text-xs text-[#333333]/70">
                    {course.instructor || "Unassigned"}
                  </p>
                </div>

                <span
                  className={`text-xs rounded-full px-3 py-1 h-fit ${
                    course.publishStatus === "Published"
                      ? "bg-[#EAF7EF] text-[#0A5E35]"
                      : "bg-red-50 text-[#D62828]"
                  }`}
                >
                  {course.publishStatus}
                </span>
              </div>
            ))}

            {report.recentCourses.length === 0 && (
              <div className="px-6 py-8 text-center text-[#333333]/70">
                No courses yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ReportCard({ icon, title, value, note, red }) {
  return (
    <div className="rounded-3xl bg-white shadow-card card-border p-6">
      <div className="flex items-center justify-between mb-5">
        <span
          className={`material-symbols-outlined ${
            red ? "text-[#D62828]" : "text-[#1A1A1A]"
          }`}
        >
          {icon}
        </span>
        <span
          className={`text-xs font-bold rounded-full px-3 py-1 heading-font ${
            red ? "bg-red-50 text-[#D62828]" : "bg-[#F2F2F2] text-[#1A1A1A]"
          }`}
        >
          Live
        </span>
      </div>

      <p className="text-sm text-[#333333]/70">{title}</p>
      <h3 className="text-3xl font-extrabold heading-font mt-2">{value}</h3>
      <p className="text-xs text-[#333333]/70 mt-3">{note}</p>
    </div>
  );
}

function MiniCard({ title, value, warning }) {
  return (
    <div className="rounded-2xl bg-white shadow-card card-border p-5">
      <p className="text-xs uppercase tracking-wider text-[#333333]/70">
        {title}
      </p>

      <h3
        className={`text-2xl font-extrabold heading-font mt-2 ${
          warning ? "text-[#D62828]" : "text-[#1A1A1A]"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

function BarRow({ label, value, maxValue, dark }) {
  const width = maxValue === 0 ? 0 : Math.round((value / maxValue) * 100);

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="font-bold">{value}</span>
      </div>

      <div className="h-3 bg-[#F2F2F2] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            dark ? "bg-[#1A1A1A]" : "bg-[#D62828]"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function AlertRow({ title, value, link }) {
  return (
    <Link
      to={link}
      className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4 flex items-center justify-between hover:bg-white/10 transition"
    >
      <span className="text-sm">{title}</span>
      <span className="text-xs px-3 py-1 rounded-full bg-red-50 text-[#D62828] heading-font font-bold">
        {value}
      </span>
    </Link>
  );
}