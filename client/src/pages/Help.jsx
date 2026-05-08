import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createSupportRequest,
  deleteSupportRequest,
  getSupportRequests,
  updateSupportRequest,
} from "../api/supportRequestsApi";
const issueTypes = [
  "Technical",
  "Users",
  "Courses",
  "Payments",
  "Reports",
  "Educational Centers",
  "Settings",
  "Other",
];

const priorities = ["Low", "Medium", "High"];
const statuses = ["Open", "In Progress", "Resolved", "Closed"];

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClass(status) {
  if (status === "Resolved") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (status === "Closed") {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  if (status === "In Progress") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-red-50 text-[#D62828] border-red-200";
}

function getPriorityClass(priority) {
  if (priority === "High") return "text-[#D62828]";
  if (priority === "Low") return "text-green-700";
  return "text-amber-700";
}

export default function Help() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pageName: "",
    issueType: "Technical",
    priority: "Medium",
    message: "",
  });

  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loadSupportRequests() {
    try {
      setLoading(true);
      setError("");

      const data = await getSupportRequests({
        search,
        status: statusFilter,
        issueType: typeFilter,
      });

      setSupportRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load support requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitLoading(true);
      setError("");
      setNotice("");

      const result = await createSupportRequest(formData);

      setFormData({
        name: "",
        email: "",
        pageName: "",
        issueType: "Technical",
        priority: "Medium",
        message: "",
      });

      setNotice(result.message);

      const data = await getSupportRequests({
        search,
        status: statusFilter,
        issueType: typeFilter,
      });

      setSupportRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to send support request");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      setError("");
      await updateSupportRequest(id, { status });

      setSupportRequests((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status } : item)),
      );
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  }

  async function handlePriorityChange(id, priority) {
    try {
      setError("");
      await updateSupportRequest(id, { priority });

      setSupportRequests((prev) =>
        prev.map((item) => (item._id === id ? { ...item, priority } : item)),
      );
    } catch (err) {
      setError(err.message || "Failed to update priority");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this support request?");

    if (!confirmed) return;

    try {
      setError("");
      await deleteSupportRequest(id);

      setSupportRequests((prev) => prev.filter((item) => item._id !== id));
      setNotice("Support request deleted successfully");
    } catch (err) {
      setError(err.message || "Failed to delete support request");
    }
  }

  useEffect(() => {
    loadSupportRequests();
  }, []);

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
            Admin Help
          </p>

          <h1 className="text-4xl font-extrabold heading-font">Help Center</h1>

          <p className="text-[#333333]/70 mt-2">
            Send support requests and manage submitted tickets.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="h-12 px-6 rounded-xl bg-[#1A1A1A] text-white text-sm font-bold heading-font flex items-center justify-center gap-2 hover:bg-black transition"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
          Back to Dashboard
        </Link>
      </header>

      {notice && (
        <div className="mb-5 rounded-2xl bg-green-50 border border-green-200 text-green-700 px-5 py-4 text-sm font-semibold">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 text-[#D62828] px-5 py-4 text-sm font-semibold">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#8c151b] to-[#D62828] p-10 rounded-3xl text-white shadow-card relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-3 heading-font">
              Need Direct Support?
            </h2>

            <p className="text-white/90 mb-7 max-w-2xl leading-7">
              Use the form to send your issue to the platform support team.
              Include the page name, issue type, and what exactly is not
              working.
            </p>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <input
                name="name"
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                className="h-14 rounded-xl bg-white/95 text-[#1A1A1A] px-5 outline-none"
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                className="h-14 rounded-xl bg-white/95 text-[#1A1A1A] px-5 outline-none"
                required
              />

              <input
                name="pageName"
                type="text"
                placeholder="Page Name"
                value={formData.pageName}
                onChange={handleChange}
                className="h-14 rounded-xl bg-white/95 text-[#1A1A1A] px-5 outline-none md:col-span-2"
                required
              />

              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                className="h-14 rounded-xl bg-white/95 text-[#1A1A1A] px-5 outline-none"
              >
                {issueTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="h-14 rounded-xl bg-white/95 text-[#1A1A1A] px-5 outline-none"
              >
                {priorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>

              <textarea
                name="message"
                rows="6"
                placeholder="Describe the issue..."
                value={formData.message}
                onChange={handleChange}
                className="rounded-xl bg-white/95 text-[#1A1A1A] px-5 py-4 outline-none md:col-span-2 resize-none"
                required
              />

              <button
                type="submit"
                disabled={submitLoading}
                className="md:col-span-2 h-14 rounded-xl bg-[#1A1A1A] text-white font-bold heading-font hover:bg-black transition disabled:opacity-60"
              >
                {submitLoading ? "Sending..." : "Submit Support Request"}
              </button>
            </form>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10">
            <span className="material-symbols-outlined text-[12rem]">
              support_agent
            </span>
          </div>
        </div>

        <aside className="bg-white border border-[#E5E5E5] p-7 rounded-3xl shadow-card">
          <h3 className="font-bold mb-5 heading-font text-2xl">
            Support Channels
          </h3>

          <div className="space-y-4">
            <div className="rounded-2xl bg-[#F2F2F2] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
                Email
              </p>
              <p className="text-sm font-semibold">support@sonoschool.com</p>
            </div>

            <div className="rounded-2xl bg-[#F2F2F2] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
                Phone
              </p>
              <p className="text-sm font-semibold">+20 100 000 0000</p>
            </div>

            <div className="rounded-2xl bg-[#F2F2F2] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
                Hours
              </p>
              <p className="text-sm font-semibold">
                Sun - Thu, 9:00 AM - 5:00 PM
              </p>
            </div>

            <div className="rounded-2xl bg-[#EAF7EF] p-5 border border-[#d8efdf]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0A5E35] mb-2">
                Status
              </p>
              <p className="text-sm font-semibold text-[#0A5E35]">
                Support team available
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="bg-white rounded-3xl shadow-card border border-[#E5E5E5] overflow-hidden">
        <div className="p-6 border-b border-[#EEEEEE] bg-[#FAFAFA] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold heading-font">
              Support Requests
            </h2>

            <p className="text-sm text-[#333333]/70 mt-1">
              Total requests: {supportRequests.length}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl border border-[#DDDDDD] px-4 text-sm outline-none"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-[#DDDDDD] px-4 text-sm outline-none"
            >
              <option>All</option>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 rounded-xl border border-[#DDDDDD] px-4 text-sm outline-none"
            >
              <option>All</option>
              {issueTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadSupportRequests}
              className="h-11 rounded-xl bg-[#D62828] text-white px-5 text-sm font-bold"
            >
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F8F8] text-[#333333]/70">
              <tr>
                <th className="text-left px-6 py-4 font-bold">Requester</th>
                <th className="text-left px-6 py-4 font-bold">Page</th>
                <th className="text-left px-6 py-4 font-bold">Type</th>
                <th className="text-left px-6 py-4 font-bold">Priority</th>
                <th className="text-left px-6 py-4 font-bold">Status</th>
                <th className="text-left px-6 py-4 font-bold">Created</th>
                <th className="text-right px-6 py-4 font-bold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EEEEEE]">
              {loading && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-[#333333]/70"
                  >
                    Loading support requests...
                  </td>
                </tr>
              )}

              {!loading && supportRequests.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-[#333333]/70"
                  >
                    No support requests found.
                  </td>
                </tr>
              )}

              {!loading &&
                supportRequests.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAFAFA] align-top">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1A1A1A]">{item.name}</p>
                      <p className="text-xs text-[#333333]/60 mt-1">
                        {item.email}
                      </p>
                      <p className="text-xs text-[#333333]/70 mt-2 max-w-[280px]">
                        {item.message}
                      </p>
                    </td>

                    <td className="px-6 py-4 font-semibold">{item.pageName}</td>

                    <td className="px-6 py-4">{item.issueType}</td>

                    <td className="px-6 py-4">
                      <select
                        value={item.priority}
                        onChange={(e) =>
                          handlePriorityChange(item._id, e.target.value)
                        }
                        className={`h-9 rounded-lg border border-[#DDDDDD] px-2 text-xs font-bold outline-none ${getPriorityClass(
                          item.priority,
                        )}`}
                      >
                        {priorities.map((priority) => (
                          <option key={priority}>{priority}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item._id, e.target.value)
                        }
                        className={`h-9 rounded-lg border px-2 text-xs font-bold outline-none ${getStatusClass(
                          item.status,
                        )}`}
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4 text-[#333333]/70 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="h-9 px-4 rounded-lg bg-red-50 text-[#D62828] text-xs font-bold hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
