import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getAdminPermissions,
  updateAdminPermissions,
} from "../api/adminPermissionsApi";

const permissionItems = [
  {
    key: "accessDashboard",
    label: "Access Dashboard",
    description: "Allow admin to open the admin dashboard.",
  },
  {
    key: "manageUsers",
    label: "Manage Users",
    description: "Allow admin to add, edit, delete, and review users.",
  },
  {
    key: "manageAdmins",
    label: "Manage Admins",
    description: "Allow admin to review admin accounts.",
  },
  {
    key: "manageCourses",
    label: "Manage Courses",
    description: "Allow admin to add, edit, archive, and publish courses.",
  },
  {
    key: "manageEducationalCenters",
    label: "Manage Educational Centers",
    description: "Allow admin to manage centers and their profiles.",
  },
  {
    key: "managePayments",
    label: "Manage Payments",
    description: "Allow admin to review payments and payment settings.",
  },
  {
    key: "manageReports",
    label: "Manage Reports",
    description: "Allow admin to view and export reports.",
  },
  {
    key: "manageSettings",
    label: "Manage Settings",
    description: "Allow admin to update platform settings.",
  },
  {
    key: "manageSystemLogs",
    label: "Manage System Logs",
    description: "Allow admin to view system logs and audit history.",
  },
  {
    key: "approveInstructors",
    label: "Approve Instructors",
    description: "Allow admin to approve or reject instructor accounts.",
  },
  {
    key: "manageSupportRequests",
    label: "Manage Support Requests",
    description: "Allow admin to review and update support tickets.",
  },
];

const defaultPermissions = {
  accessDashboard: true,
  manageUsers: false,
  manageAdmins: false,
  manageCourses: false,
  manageEducationalCenters: false,
  managePayments: false,
  manageReports: false,
  manageSettings: false,
  manageSystemLogs: false,
  approveInstructors: false,
  manageSupportRequests: false,
  permissionLevel: "Basic",
  accessNote:
    "Admin access is limited based on assigned permissions. Only super admins can update admin permissions.",
};

const permissionLevels = ["Basic", "Moderate", "Full Access"];

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
}

function isAdminSuper(admin) {
  if (!admin) return false;

  return (
    normalize(admin.adminLevel) === "super_admin" ||
    normalize(admin.accessLevel) === "super_admin" ||
    normalize(admin.accessLevel) === "superadmin" ||
    normalize(admin.accessLevel) === "full_access" ||
    normalize(admin.permissionsLevel) === "full"
  );
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getPermissionLevelClass(level) {
  if (level === "Full Access") {
    return "bg-red-50 text-[#D62828] border-red-200";
  }

  if (level === "Moderate") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-[#F2F2F2] text-[#1A1A1A] border-[#DDDDDD]";
}

export default function AdminPermissions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadPermissions() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminPermissions(id);

      setAdmin(data.admin);
      setCanEdit(Boolean(data.canEdit));
      setIsSuperAdmin(isAdminSuper(data.admin));

      setPermissions({
        ...defaultPermissions,
        ...(data.permissions || {}),
      });
    } catch (err) {
      setError(err.message || "Failed to load admin permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPermissions();
  }, [id]);

  function handlePermissionChange(key) {
    if (!canEdit) return;

    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handlePermissionLevelChange(e) {
    if (!canEdit) return;

    setPermissions((prev) => ({
      ...prev,
      permissionLevel: e.target.value,
    }));
  }

  function handleNoteChange(e) {
    if (!canEdit) return;

    setPermissions((prev) => ({
      ...prev,
      accessNote: e.target.value,
    }));
  }

  function handleResetDefaults() {
    if (!canEdit) return;

    setPermissions(defaultPermissions);
    setIsSuperAdmin(false);
  }

  async function handleSave() {
    if (!canEdit) {
      setError("Only super admin can update admin permissions");
      return;
    }

    try {
      setSaving(true);
      setNotice("");
      setError("");

      const data = await updateAdminPermissions(id, {
        ...permissions,
        adminLevel: isSuperAdmin ? "super_admin" : "admin",
        accessLevel: isSuperAdmin ? "Super Admin" : "Admin",
        permissionsLevel: isSuperAdmin ? "full" : "basic",
      });

      setAdmin(data.admin);
      setCanEdit(Boolean(data.canEdit));
      setIsSuperAdmin(isAdminSuper(data.admin));

      setPermissions({
        ...defaultPermissions,
        ...(data.permissions || {}),
      });

      setNotice("Admin permissions updated successfully");
    } catch (err) {
      setError(err.message || "Failed to update admin permissions");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
              Permission Management
            </p>

            <h1 className="text-4xl font-extrabold heading-font">
              Admin Permissions
            </h1>

            <p className="text-[#333333]/70 mt-2">
              Review admin access. Editing is restricted to super admin only.
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

        {!canEdit && !loading && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 text-sm font-semibold">
            View only. Only super admin can edit these permissions.
          </div>
        )}

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
              Loading admin permissions...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap mb-8 pb-6 border-b border-[#EEEEEE]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#D62828]">
                    <span className="material-symbols-outlined text-[34px]">
                      admin_panel_settings
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold heading-font">
                      {admin?.name || "Admin"}
                    </h2>

                    <p className="text-sm text-[#333333]/70 mt-1">
                      {admin?.email || "No email available"}
                    </p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs rounded-full bg-[#F2F2F2] px-3 py-1 font-bold capitalize">
                        Role: Admin
                      </span>

                      {isSuperAdmin && (
                        <span className="text-xs rounded-full bg-red-50 text-[#D62828] px-3 py-1 font-bold">
                          Super Admin
                        </span>
                      )}

                      <span
                        className={`text-xs rounded-full border px-3 py-1 font-bold ${getPermissionLevelClass(
                          permissions.permissionLevel
                        )}`}
                      >
                        {permissions.permissionLevel}
                      </span>
                    </div>

                    <p className="text-xs text-[#333333]/50 mt-2">
                      Last updated: {formatDate(admin?.updatedAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  disabled={!canEdit}
                  className="h-11 px-4 rounded-xl border border-[#DDDDDD] text-sm font-bold hover:bg-[#F2F2F2] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
                <div className="bg-[#F2F2F2] rounded-2xl p-5 border border-[#DDDDDD]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#333333] block mb-3">
                    Permission Level
                  </label>

                  <select
                    value={permissions.permissionLevel}
                    onChange={handlePermissionLevelChange}
                    disabled={!canEdit}
                    className="w-full h-12 rounded-xl border border-[#DDDDDD] bg-white px-4 outline-none disabled:opacity-60"
                  >
                    {permissionLevels.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <label
                  className={`rounded-2xl p-5 border border-[#DDDDDD] flex items-center justify-between gap-5 ${
                    canEdit
                      ? "bg-[#F2F2F2] cursor-pointer"
                      : "bg-[#F7F7F7] cursor-not-allowed opacity-75"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold heading-font">
                      Super Admin Access
                    </p>

                    <p className="text-xs text-[#333333]/65 mt-1 leading-5">
                      Allows this admin to update admin permissions.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={isSuperAdmin}
                    disabled={!canEdit}
                    onChange={() => canEdit && setIsSuperAdmin((prev) => !prev)}
                    className="w-5 h-5 accent-[#D62828] disabled:opacity-50"
                  />
                </label>

                <div className="bg-[#1A1A1A] text-white rounded-2xl p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Edit Rule
                  </p>

                  <p className="text-sm font-bold">
                    {canEdit
                      ? "You can edit this page."
                      : "You can only view this page."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {permissionItems.map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-start justify-between gap-5 rounded-2xl p-5 border transition ${
                      canEdit
                        ? "bg-[#F2F2F2] border-transparent hover:border-[#DDDDDD] cursor-pointer"
                        : "bg-[#F7F7F7] border-[#E5E5E5] cursor-not-allowed opacity-75"
                    }`}
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
                      disabled={!canEdit}
                      onChange={() => handlePermissionChange(item.key)}
                      className="w-5 h-5 mt-1 accent-[#D62828] disabled:opacity-50"
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-xs font-bold uppercase tracking-wider text-[#333333]">
                  Admin Access Note
                </label>

                <textarea
                  rows="4"
                  value={permissions.accessNote || ""}
                  onChange={handleNoteChange}
                  disabled={!canEdit}
                  className="w-full bg-[#F2F2F2] border border-[#DDDDDD] rounded-xl px-4 py-3 outline-none focus:border-[#D62828] resize-none disabled:opacity-60"
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
                  disabled={saving || !canEdit}
                  className="px-6 py-3 bg-[#D62828] text-white rounded-xl font-bold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
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