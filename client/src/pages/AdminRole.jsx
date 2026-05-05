import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminRole, updateAdminRole } from "../api/adminApi";

export default function AdminRole() {
  const navigate = useNavigate();

  const [roleName, setRoleName] = useState("");
  const [accessLevel, setAccessLevel] = useState("");

  const [permissions, setPermissions] = useState({
    manageUsers: false,
    manageCourses: false,
    managePayments: false,
    manageReports: false,
    manageSettings: false,
    viewLogs: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(function () {
    async function loadRole() {
      try {
        const data = await getAdminRole();

        setRoleName(data.roleName);
        setAccessLevel(data.accessLevel);
        setPermissions(data.permissions);
      } catch (error) {
        alert(error.message);
        console.error("Load admin role error:", error.message);
      } finally {
        setLoading(false);
      }
    }

    loadRole();
  }, []);

  function togglePermission(key) {
    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await updateAdminRole({
        roleName,
        accessLevel,
        permissions,
      });

      alert("Admin role updated successfully");
      navigate("/profile");
    } catch (error) {
      alert(error.message);
      console.error("Update admin role error:", error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="font-bold text-[#1A1A1A]">Loading role...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#D62828] font-bold hover:underline"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
          Back
        </button>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-[#DDDDDD] shadow-[0_8px_30px_rgba(26,26,26,0.05)] p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-[#D62828]/10 flex items-center justify-center text-[#D62828]">
              <span className="material-symbols-outlined text-[28px]">
                admin_panel_settings
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold heading-font text-[#1A1A1A]">
                Admin Role Settings
              </h1>
              <p className="text-sm text-[#333333] mt-1">
                Manage full-access permissions for system administrators.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#333333]">
                Role Name
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full bg-[#F2F2F2] border border-[#DDDDDD] rounded-lg px-4 py-3 outline-none focus:border-[#D62828] focus:ring-2 focus:ring-[#D62828]/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#333333]">
                Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full bg-[#F2F2F2] border border-[#DDDDDD] rounded-lg px-4 py-3 outline-none focus:border-[#D62828] focus:ring-2 focus:ring-[#D62828]/20"
              >
                <option>Full Access</option>
                <option>Limited Admin</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-bold heading-font">Permissions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PermissionItem
                label="Manage Users"
                checked={permissions.manageUsers}
                onChange={() => togglePermission("manageUsers")}
              />

              <PermissionItem
                label="Manage Courses"
                checked={permissions.manageCourses}
                onChange={() => togglePermission("manageCourses")}
              />

              <PermissionItem
                label="Manage Payments"
                checked={permissions.managePayments}
                onChange={() => togglePermission("managePayments")}
              />

              <PermissionItem
                label="Manage Reports"
                checked={permissions.manageReports}
                onChange={() => togglePermission("manageReports")}
              />

              <PermissionItem
                label="Manage Settings"
                checked={permissions.manageSettings}
                onChange={() => togglePermission("manageSettings")}
              />

              <PermissionItem
                label="View Logs"
                checked={permissions.viewLogs}
                onChange={() => togglePermission("viewLogs")}
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-[#DDDDDD] rounded-lg font-semibold hover:bg-[#F2F2F2]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#D62828] text-white rounded-lg font-bold hover:bg-[#B92323] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function PermissionItem({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between bg-[#F2F2F2] rounded-xl p-4">
      <span className="text-sm font-medium">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5"
      />
    </label>
  );
}