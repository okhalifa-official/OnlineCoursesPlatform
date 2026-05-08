import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementMeta,
  getAnnouncements,
} from "../api/bulkAnnouncementsApi";

const templates = [
  {
    title: "Payment Reminder",
    subject: "Payment Reminder",
    body:
      "Dear user,\n\nThis is a reminder to complete your pending payment to keep your course access active.\n\nThank you.",
  },
  {
    title: "Course Schedule Update",
    subject: "Course Schedule Update",
    body:
      "Dear students,\n\nPlease note that the course schedule has been updated. Check your account for the latest session details.\n\nThank you.",
  },
  {
    title: "Exam Announcement",
    subject: "Exam Announcement",
    body:
      "Dear students,\n\nYour upcoming exam details are now available. Please review the date, time, and instructions carefully.\n\nGood luck.",
  },
  {
    title: "Center Notice",
    subject: "Center Notice",
    body:
      "Dear users,\n\nPlease note that there is an important update from your educational center. Check the platform for more details.\n\nThank you.",
  },
];

const defaultForm = {
  subject: "",
  audienceType: "all",
  center: "all",
  course: "all",
  deliveryMethod: "in_app",
  priority: "normal",
  scheduleType: "send_now",
  scheduledAt: "",
  body: "",
};

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClass(status) {
  if (status === "sent") return "bg-green-50 text-green-700";
  if (status === "scheduled") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-[#D62828]";
}

export default function BulkAnnouncements() {
  const [formData, setFormData] = useState(defaultForm);
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadPageData() {
    try {
      setLoading(true);
      setError("");

      const [meta, history] = await Promise.all([
        getAnnouncementMeta(),
        getAnnouncements(),
      ]);

      setCenters(Array.isArray(meta.centers) ? meta.centers : []);
      setCourses(Array.isArray(meta.courses) ? meta.courses : []);
      setAnnouncements(Array.isArray(history) ? history : []);
    } catch (err) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function applyTemplate(template) {
    setFormData((prev) => ({
      ...prev,
      subject: template.subject,
      body: template.body,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSending(true);
      setNotice("");
      setError("");

      const payload = {
        ...formData,
        scheduledAt:
          formData.scheduleType === "schedule_later"
            ? formData.scheduledAt
            : null,
      };

      const result = await createAnnouncement(payload);

      setNotice(result.message || "Announcement sent successfully");
      setFormData(defaultForm);

      await loadPageData();
    } catch (err) {
      setError(err.message || "Failed to send announcement");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this announcement?");

    if (!confirmed) return;

    try {
      await deleteAnnouncement(id);
      await loadPageData();
    } catch (err) {
      setError(err.message || "Failed to delete announcement");
    }
  }

  const previewSubject = useMemo(() => {
    return formData.subject || "Announcement Subject";
  }, [formData.subject]);

  const previewBody = useMemo(() => {
    return (
      formData.body ||
      "Write your announcement message to preview it here before sending."
    );
  }, [formData.body]);

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
              Communication
            </p>

            <h1 className="heading-font text-4xl font-extrabold">
              Bulk Announcements
            </h1>

            <p className="text-[#333333]/70 mt-2 text-lg">
              Send announcements to selected groups across the platform.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="h-12 px-5 rounded-xl bg-[#1A1A1A] text-white text-sm font-bold heading-font flex items-center justify-center gap-2 hover:bg-black transition"
            >
              <span className="material-symbols-outlined text-[20px]">
                dashboard
              </span>
              Dashboard
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="h-12 px-6 rounded-xl bg-[#D62828] text-white text-sm font-bold heading-font flex items-center justify-center gap-2 hover:opacity-95 transition disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">
                send
              </span>
              {sending ? "Sending..." : "Send Announcement"}
            </button>
          </div>
        </header>

        {notice && (
          <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 px-5 py-4 text-sm font-semibold">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 text-[#D62828] px-5 py-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <section className="xl:col-span-2 bg-white rounded-3xl border border-[#E5E5E5] shadow-card p-8">
            <h2 className="heading-font text-2xl font-bold mb-6">
              Compose Message
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">
                  Announcement Subject
                </label>

                <input
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter subject line"
                  className="w-full h-12 rounded-xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Audience Type
                </label>

                <select
                  name="audienceType"
                  value={formData.audienceType}
                  onChange={handleChange}
                  className="w-full h-12 rounded-xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students</option>
                  <option value="instructors">Instructors</option>
                  <option value="admins">Admins</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Educational Center
                </label>

                <select
                  name="center"
                  value={formData.center}
                  onChange={handleChange}
                  className="w-full h-12 rounded-xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 outline-none"
                >
                  <option value="all">All Centers</option>
                  {centers.map((center) => (
                    <option key={center} value={center}>
                      {center}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Course Filter
                </label>

                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full h-12 rounded-xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 outline-none"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Delivery Method
                </label>

                <select
                  name="deliveryMethod"
                  value={formData.deliveryMethod}
                  onChange={handleChange}
                  className="w-full h-12 rounded-xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 outline-none"
                >
                  <option value="in_app">In-app Notification</option>
                  <option value="email">Email</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Priority
                </label>

                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full h-12 rounded-xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Schedule
                </label>

                <select
                  name="scheduleType"
                  value={formData.scheduleType}
                  onChange={handleChange}
                  className="w-full h-12 rounded-xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 outline-none"
                >
                  <option value="send_now">Send Now</option>
                  <option value="schedule_later">Schedule Later</option>
                </select>
              </div>

              {formData.scheduleType === "schedule_later" && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Scheduled Date
                  </label>

                  <input
                    name="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={handleChange}
                    className="w-full h-12 rounded-xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 outline-none"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">
                  Message Body
                </label>

                <textarea
                  name="body"
                  rows="10"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Write your announcement..."
                  className="w-full rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 py-3 outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828] resize-none"
                  required
                />
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-card p-6">
              <h3 className="heading-font text-xl font-bold mb-4">
                Announcement Preview
              </h3>

              <div className="rounded-2xl bg-[#F2F2F2] p-5">
                <p className="text-xs uppercase tracking-wider text-[#333333]/70 mb-2">
                  Preview
                </p>

                <h4 className="font-bold text-lg mb-2">
                  {previewSubject}
                </h4>

                <p className="text-sm text-[#333333]/80 leading-6 whitespace-pre-line">
                  {previewBody}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-card p-6">
              <h3 className="heading-font text-xl font-bold mb-4">
                Quick Templates
              </h3>

              <div className="space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="w-full text-left rounded-2xl border border-[#E5E5E5] px-4 py-3 hover:bg-[#F2F2F2] transition font-semibold"
                  >
                    {template.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="bg-white rounded-3xl border border-[#E5E5E5] shadow-card overflow-hidden">
          <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between gap-4">
            <div>
              <h2 className="heading-font text-2xl font-bold">
                Announcement History
              </h2>

              <p className="text-sm text-[#333333]/70 mt-1">
                Latest sent and scheduled announcements.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPageData}
              className="rounded-xl bg-[#1A1A1A] text-white px-5 py-3 text-sm font-bold"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAFAFA]">
                <tr>
                  <th className="px-6 py-4 font-bold text-[#333333]/70">
                    Subject
                  </th>
                  <th className="px-6 py-4 font-bold text-[#333333]/70">
                    Audience
                  </th>
                  <th className="px-6 py-4 font-bold text-[#333333]/70">
                    Delivery
                  </th>
                  <th className="px-6 py-4 font-bold text-[#333333]/70">
                    Recipients
                  </th>
                  <th className="px-6 py-4 font-bold text-[#333333]/70">
                    Status
                  </th>
                  <th className="px-6 py-4 font-bold text-[#333333]/70">
                    Created
                  </th>
                  <th className="px-6 py-4 font-bold text-[#333333]/70 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E5E5E5]">
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-[#333333]/70">
                      Loading announcements...
                    </td>
                  </tr>
                )}

                {!loading && announcements.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-[#333333]/70">
                      No announcements found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  announcements.map((item) => (
                    <tr key={item._id} className="hover:bg-[#FCFCFC]">
                      <td className="px-6 py-5">
                        <p className="font-bold">{item.subject}</p>
                        <p className="text-xs text-[#333333]/60 mt-1 line-clamp-1">
                          {item.body}
                        </p>
                      </td>

                      <td className="px-6 py-5 capitalize">
                        {item.audienceType}
                      </td>

                      <td className="px-6 py-5 capitalize">
                        {String(item.deliveryMethod || "").replace("_", " ")}
                      </td>

                      <td className="px-6 py-5">
                        {item.totalRecipients}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-[#333333]/70 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="rounded-lg bg-red-50 text-[#D62828] px-3 py-2 text-xs font-bold hover:bg-red-100"
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
      </div>
    </main>
  );
}