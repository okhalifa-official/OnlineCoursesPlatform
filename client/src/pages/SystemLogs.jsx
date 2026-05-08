import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSystemLogs, getSystemLogStats } from "../api/systemLogsApi";

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    action: "",
    status: "",
    module: "",
    date: "",
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  async function loadLogs() {
    try {
      setLoading(true);

      const [logsData, statsData] = await Promise.all([
        getSystemLogs(filters),
        getSystemLogStats(),
      ]);

      setLogs(logsData.logs || []);
      setStats(statsData);

      setPagination({
        total: logsData.total || 0,
        totalPages: logsData.totalPages || 1,
      });
    } catch (error) {
      alert(error.message);
      console.error("Load system logs error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(
    function () {
      const timer = setTimeout(function () {
        loadLogs();
      }, 300);

      return function () {
        clearTimeout(timer);
      };
    },
    [
      filters.search,
      filters.role,
      filters.action,
      filters.status,
      filters.module,
      filters.date,
      filters.page,
    ]
  );

  function handleChange(e) {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  }

  function goToPage(page) {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  }

  function exportLogs() {
    const rows = logs.map((log) => ({
      user: log.actorName,
      email: log.actorEmail,
      role: log.actorRole,
      module: log.module,
      action: log.action,
      target: log.targetEntity,
      status: log.status,
      date: formatDate(log.createdAt),
      time: formatTime(log.createdAt),
      ip: log.ipAddress,
    }));

    const csv = [
      Object.keys(
        rows[0] || {
          user: "",
          email: "",
          role: "",
          module: "",
          action: "",
          target: "",
          status: "",
          date: "",
          time: "",
          ip: "",
        }
      ).join(","),
      ...rows.map((row) =>
        Object.values(row)
          .map((value) => `"${String(value || "").replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "system-logs.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="max-w-7xl mx-auto">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-charcoal mb-2 heading-font">
              System Logs
            </h1>

            <p className="text-lg text-[#333333] font-medium max-w-2xl">
              Audit and track all system activity across admins, users, courses,
              educational centers, and user-side actions.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-xl hover:bg-brandRed transition font-bold heading-font"
            >
              <span className="material-symbols-outlined text-[20px]">
                dashboard
              </span>
              Dashboard
            </Link>

            <button
              type="button"
              onClick={exportLogs}
              className="flex items-center gap-2 px-6 py-3 bg-brandRed text-white rounded-xl hover:opacity-90 transition font-bold heading-font"
            >
              <span className="material-symbols-outlined text-[20px]">
                download
              </span>
              Export Logs
            </button>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl mb-8 flex flex-wrap items-end gap-4 border border-[#E5E5E5] shadow-card">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-widest mb-1.5 ml-1">
              Search Action / User
            </label>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-sm">
                search
              </span>

              <input
                name="search"
                value={filters.search}
                onChange={handleChange}
                className="w-full bg-softGrey pl-9 pr-4 py-2.5 rounded-lg border border-[#DDDDDD] text-sm focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed outline-none"
                placeholder="Search by user, action, entity, IP..."
                type="text"
              />
            </div>
          </div>

          <FilterSelect
            label="Role"
            name="role"
            value={filters.role}
            onChange={handleChange}
            options={[
              ["", "All Roles"],
              ["Super Admin", "Super Admin"],
              ["Admin", "Admin"],
              ["user", "User"],
              ["User", "User"],
              ["Guest", "Guest"],
            ]}
          />

          <FilterSelect
            label="Action Type"
            name="action"
            value={filters.action}
            onChange={handleChange}
            options={[
              ["", "All Actions"],
              ["create", "Creation"],
              ["update", "Update"],
              ["delete", "Deletion"],
              ["login", "Authentication"],
            ]}
          />

          <FilterSelect
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            options={[
              ["", "All Status"],
              ["Success", "Success"],
              ["Failed", "Failed"],
            ]}
          />

          <FilterSelect
            label="Module"
            name="module"
            value={filters.module}
            onChange={handleChange}
            options={[
              ["", "All Modules"],
              ["Educational Centers", "Educational Centers"],
              ["Users", "Users"],
              ["Courses", "Courses"],
              ["Reports", "Reports"],
              ["Lectures", "Lectures"],
              ["Admin", "Admin"],
              ["Authentication", "Authentication"],
              ["User Side", "User Side"],
            ]}
          />

          <FilterSelect
            label="Date Range"
            name="date"
            value={filters.date}
            onChange={handleChange}
            options={[
              ["", "All Dates"],
              ["today", "Today"],
              ["7days", "Last 7 Days"],
              ["30days", "Last 30 Days"],
            ]}
          />
        </section>

        <section className="bg-white rounded-2xl overflow-hidden shadow-card border border-[#E5E5E5]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA]">
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Module</Th>
                  <Th>Action</Th>
                  <Th>Target Entity</Th>
                  <Th center>Status</Th>
                  <Th>Date & Time</Th>
                  <Th>IP Address</Th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EEEEEE]">
                {loading && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-10 text-center text-sm text-[#333333]"
                    >
                      Loading logs...
                    </td>
                  </tr>
                )}

                {!loading &&
                  logs.map((log) => (
                    <tr
                      key={log._id}
                      className={`transition-colors ${
                        log.status === "Failed"
                          ? "bg-red-50/60 hover:bg-red-50"
                          : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-softGrey flex items-center justify-center text-[#333333]">
                            <span className="material-symbols-outlined">
                              person
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-charcoal">
                              {log.actorName || "Unknown User"}
                            </p>

                            <p className="text-xs text-[#888888]">
                              {log.actorEmail || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-xs font-medium text-[#333333] bg-softGrey px-2 py-1 rounded-md">
                          {log.actorRole || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm text-[#333333]">
                          {log.module || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p
                          className={`text-sm font-semibold ${
                            log.status === "Failed"
                              ? "text-red-700"
                              : "text-brandRed"
                          }`}
                        >
                          {log.action}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#888888] text-sm">
                            {getTargetIcon(log.module)}
                          </span>

                          <span className="text-sm text-[#333333]">
                            {log.targetEntity || "-"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            log.status === "Success"
                              ? "bg-[#EAF7EF] text-[#0A5E35]"
                              : "bg-[#FFE7E7] text-[#BA1A1A]"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="text-sm">
                          <p className="font-medium text-charcoal">
                            {formatDate(log.createdAt)}
                          </p>

                          <p className="text-xs text-[#888888]">
                            {formatTime(log.createdAt)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-xs font-mono text-[#333333]">
                          {log.ipAddress || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-[#999999] hover:text-brandRed transition-colors"
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-10 text-center text-sm text-[#333333]"
                    >
                      No matching logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#EEEEEE] flex items-center justify-between">
            <p className="text-xs text-[#333333] font-medium">
              Showing {logs.length} of {pagination.total} entries
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => goToPage(filters.page - 1)}
                className="p-1.5 rounded-md hover:bg-[#e9e9e9] transition-colors text-[#999999] disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_left
                </span>
              </button>

              <span className="w-8 h-8 rounded-md bg-brandRed text-white text-xs font-bold flex items-center justify-center">
                {filters.page}
              </span>

              <button
                type="button"
                disabled={filters.page >= pagination.totalPages}
                onClick={() => goToPage(filters.page + 1)}
                className="p-1.5 rounded-md hover:bg-[#e9e9e9] transition-colors text-[#999999] disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-lg">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Security Alerts"
            value={stats?.securityAlerts ?? 0}
            badge={`${stats?.failedActivity ?? 0} failed`}
            danger
          />

          <StatCard
            label="Total Activity"
            value={stats?.totalActivity ?? 0}
            badge="All actions"
          />

          <StatCard
            label="Success Activity"
            value={stats?.successActivity ?? 0}
            badge="Successful"
            success
          />

          <StatCard
            label="Active Sessions"
            value={stats?.activeSessions ?? 0}
            badge="Last 24h"
          />
        </section>
      </div>

      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </main>
  );
}

function FilterSelect({ label, name, value, onChange, options }) {
  return (
    <div className="w-44">
      <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-widest mb-1.5 ml-1">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-softGrey border border-[#DDDDDD] px-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed outline-none"
      >
        {options.map(([optionValue, labelText]) => (
          <option value={optionValue} key={labelText}>
            {labelText}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({ children, center }) {
  return (
    <th
      className={`px-6 py-4 text-[11px] font-bold text-[#333333] uppercase tracking-wider ${
        center ? "text-center" : ""
      }`}
    >
      {children}
    </th>
  );
}

function StatCard({ label, value, badge, danger, success }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-card">
      <p className="text-[10px] font-bold text-[#333333] uppercase tracking-widest mb-2">
        {label}
      </p>

      <div className="flex items-end justify-between gap-3">
        <h3 className="text-3xl font-extrabold text-charcoal heading-font">
          {Number(value || 0).toLocaleString()}
        </h3>

        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            danger
              ? "text-[#BA1A1A] bg-[#FFE7E7]"
              : success
              ? "text-[#0A5E35] bg-[#EAF7EF]"
              : "text-[#333333] bg-softGrey"
          }`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
}

function LogDetailsModal({ log, onClose }) {
  return (
    <div className="fixed inset-0 z-[999] bg-black/40 px-4">
      <div className="min-h-screen flex items-center justify-center py-6">
        <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#DDDDDD] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDDDDD] shrink-0">
            <div>
              <h3 className="text-xl font-bold heading-font text-charcoal">
                Log Details
              </h3>

              <p className="text-xs text-[#333333] mt-1">{log._id}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-softGrey transition flex items-center justify-center"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
              <Detail label="User" value={log.actorName} />
              <Detail label="Email / Source" value={log.actorEmail} />
              <Detail label="Role" value={log.actorRole} />
              <Detail label="Module" value={log.module} />
              <Detail label="Action" value={log.action} />
              <Detail label="Target Entity" value={log.targetEntity} />
              <Detail label="Status" value={log.status} />
              <Detail label="Severity" value={log.severity} />
              <Detail
                label="Date"
                value={`${formatDate(log.createdAt)} ${formatTime(
                  log.createdAt
                )}`}
              />
              <Detail label="IP Address" value={log.ipAddress} />
              <Detail label="Method" value={log.method} />
              <Detail label="Path" value={log.path} />
            </div>

            <div className="bg-[#111111] rounded-xl p-6 font-mono text-[13px] leading-relaxed overflow-x-auto shadow-inner">
              <p className="text-white mb-4 font-bold">Submitted Payload</p>

              <pre className="text-[#EDEDED] whitespace-pre-wrap">
                {JSON.stringify(log.newData || {}, null, 2)}
              </pre>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#DDDDDD] flex justify-end bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-brandRed text-white rounded-lg text-sm font-bold hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="bg-softGrey rounded-xl p-4">
      <p className="text-xs text-[#333333] mb-1">{label}</p>
      <p className="font-semibold text-charcoal break-words">{value || "-"}</p>
    </div>
  );
}

function getTargetIcon(moduleName) {
  if (moduleName === "Users") return "person";
  if (moduleName === "Courses") return "book";
  if (moduleName === "Educational Centers") return "home";
  if (moduleName === "Reports") return "bar_chart";
  if (moduleName === "Authentication") return "lock";
  return "receipt_long";
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString();
}

function formatTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString();
}