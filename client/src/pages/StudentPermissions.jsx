import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getStudentPermissions,
  updateStudentPermissions,
} from "../api/studentPermissionsApi";

const permissionItems = [
  {
    key: "viewEnrolledCourses",
    label: "View Enrolled Courses",
    description: "Allow student to see courses assigned to their account.",
  },
  {
    key: "downloadResources",
    label: "Download Resources",
    description: "Allow student to download course files and materials.",
  },
  {
    key: "takeQuizzes",
    label: "Take Quizzes",
    description: "Allow student to take quizzes and exams.",
  },
  {
    key: "submitAssignments",
    label: "Submit Assignments",
    description: "Allow student to upload and submit assignments.",
  },
  {
    key: "joinDiscussions",
    label: "Join Discussions",
    description: "Allow student to participate in course discussions.",
  },
  {
    key: "viewCertificates",
    label: "View Certificates",
    description: "Allow student to view earned certificates.",
  },
  {
    key: "accessLiveSessions",
    label: "Access Live Sessions",
    description: "Allow student to join live lectures or sessions.",
  },
  {
    key: "sendMessages",
    label: "Send Messages",
    description: "Allow student to send messages inside the platform.",
  },
];

const defaultPermissions = {
  viewEnrolledCourses: true,
  downloadResources: true,
  takeQuizzes: true,
  submitAssignments: true,
  joinDiscussions: true,
  viewCertificates: true,
  accessLiveSessions: true,
  sendMessages: false,
  defaultAccessNote:
    "Students can only access the courses they are enrolled in and complete platform learning activities based on course availability.",
};

export default function StudentPermissions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadPermissions() {
    try {
      setLoading(true);
      setError("");

      const data = await getStudentPermissions(id);

      setStudent(data.student);
      setPermissions({
        ...defaultPermissions,
        ...(data.permissions || {}),
      });
    } catch (err) {
      setError(err.message || "Failed to load student permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPermissions();
  }, [id]);

  function handlePermissionChange(key) {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleNoteChange(e) {
    setPermissions((prev) => ({
      ...prev,
      defaultAccessNote: e.target.value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setNotice("");
      setError("");

      const data = await updateStudentPermissions(id, permissions);

      setPermissions({
        ...defaultPermissions,
        ...(data.permissions || {}),
      });

      setNotice("Student permissions updated successfully");
    } catch (err) {
      setError(err.message || "Failed to update student permissions");
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    setPermissions(defaultPermissions);
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
              User Management
            </p>

            <h1 className="text-4xl font-extrabold heading-font">
              Student Permissions
            </h1>

            <p className="text-[#333333]/70 mt-2">
              Control what this student can access and interact with.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/users"
              className="h-12 px-5 rounded-xl bg-white border border-[#DDDDDD] text-[#1A1A1A] text-sm font-bold heading-font flex items-center justify-center gap-2 hover:bg-[#f8f8f8] transition"
            >
              <span className="material-symbols-outlined text-[20px]">
                group
              </span>
              Back to Users
            </Link>

            <Link
              to="/dashboard"
              className="h-12 px-5 rounded-xl bg-[#1A1A1A] text-white text-sm font-bold heading-font flex items-center justify-center gap-2 hover:bg-black transition"
            >
              <span className="material-symbols-outlined text-[20px]">
                dashboard
              </span>
              Dashboard
            </Link>
          </div>
        </header>

        {notice && (
          <div className="rounded-2xl bg-green-50 border border-green-200 text-green-700 px-5 py-4 text-sm font-semibold">
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 text-[#D62828] px-5 py-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <section className="bg-white rounded-3xl border border-[#E5E5E5] shadow-card p-8">
          {loading ? (
            <div className="py-16 text-center text-[#333333]/70">
              Loading student permissions...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap mb-8 pb-6 border-b border-[#EEEEEE]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#D62828]">
                    <span className="material-symbols-outlined text-[34px]">
                      person
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold heading-font">
                      {student?.name || "Student"}
                    </h2>

                    <p className="text-sm text-[#333333]/70 mt-1">
                      {student?.email || "No email available"}
                    </p>

                    <p className="text-xs text-[#333333]/50 mt-1 capitalize">
                      Role: {student?.role || "student"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="h-11 px-4 rounded-xl border border-[#DDDDDD] text-sm font-bold hover:bg-[#F2F2F2]"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {permissionItems.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-5 bg-[#F2F2F2] rounded-2xl p-5 border border-transparent hover:border-[#DDDDDD] transition cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold heading-font">
                        {item.label}
                      </p>

                      <p className="text-xs text-[#333333]/65 mt-1 leading-5">
                        {item.description}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={Boolean(permissions[item.key])}
                      onChange={() => handlePermissionChange(item.key)}
                      className="w-5 h-5 mt-1 accent-[#D62828]"
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-xs font-bold uppercase tracking-wider text-[#333333]">
                  Default Student Access Note
                </label>

                <textarea
                  rows="4"
                  value={permissions.defaultAccessNote || ""}
                  onChange={handleNoteChange}
                  className="w-full bg-[#F2F2F2] border border-[#DDDDDD] rounded-xl px-4 py-3 outline-none focus:border-[#D62828] resize-none"
                />
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-[#DDDDDD] rounded-xl font-semibold hover:bg-[#F2F2F2]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-[#D62828] text-white rounded-xl font-bold hover:opacity-95 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}