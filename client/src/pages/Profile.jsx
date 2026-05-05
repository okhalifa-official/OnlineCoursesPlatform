import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminProfile, getAdminRole } from "../api/adminApi";
import { useNavigate } from "react-router-dom";
import { logoutAdmin } from "../api/authApi";
export default function Profile() {
  const [admin, setAdmin] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    async function loadProfile() {
      try {
        const [adminData, roleData] = await Promise.all([
          getAdminProfile(),
          getAdminRole(),
        ]);

        setAdmin(adminData);
        setRole(roleData);
      } catch (error) {
        alert(error.message);
        console.error("Load admin profile error:", error.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="font-bold text-[#1A1A1A]">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] px-6 py-10 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <section className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
              Administrator Profile
            </p>
            <h1 className="text-4xl font-extrabold heading-font">
              Admin Information
            </h1>
          </div>

          <Link
            to="/dashboard"
            className="rounded-xl bg-[#1A1A1A] text-white px-5 py-3 text-sm font-semibold heading-font"
          >
            Back to Dashboard
          </Link>
          
        </section>

        <section className="mb-8 rounded-3xl bg-white shadow-card card-border overflow-hidden">
          <div className="bg-[#1A1A1A] px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                {admin.image ? (
                  <img
                    src={admin.image}
                    alt="Admin User"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#D62828] text-white flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="material-symbols-outlined text-[44px]">
                      person
                    </span>
                  </div>
                )}

                <div>
                  <h2 className="text-3xl font-extrabold text-white heading-font">
                    {admin.firstName} {admin.lastName}
                  </h2>

                  <p className="text-white/70 text-sm mt-1">
                    {admin.jobTitle}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white text-[#1A1A1A] text-xs font-bold heading-font">
                      {role?.accessLevel || admin.accessLevel}
                    </span>

                    <Link
                      to="/admin-role"
                      className="px-3 py-1 rounded-full bg-red-50 text-[#D62828] text-xs font-bold heading-font"
                    >
                      {role?.roleName || "Admins"}
                    </Link>

                    <span className="px-3 py-1 rounded-full bg-[#EAF7EF] text-[#0A5E35] text-xs font-bold heading-font">
                      {admin.accountStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Link
                  to="/admin-role"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-[#1A1A1A] px-5 py-3 text-sm font-semibold heading-font hover:bg-[#F2F2F2] transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    admin_panel_settings
                  </span>
                  Role Settings
                </Link>

                <Link
                  to="/profile/edit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D62828] text-white px-5 py-3 text-sm font-semibold heading-font hover:bg-[#B92323] transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    edit
                  </span>
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <ProfileCard title="Personal Details" subtitle="Basic Information">
            <InfoItem label="First Name" value={admin.firstName} />
            <InfoItem label="Last Name" value={admin.lastName} />
            <InfoItem label="Gender" value={admin.gender} />
            <InfoItem label="Date of Birth" value={admin.dateOfBirth} />
            <InfoItem label="Bio" value={admin.bio} wide />
          </ProfileCard>

          <ProfileCard title="Contact Details" subtitle="Communication Info">
            <InfoItem label="Email Address" value={admin.email} />
            <InfoItem label="Phone Number" value={admin.phone} />
            <InfoItem label="Office Number" value={admin.office} />
            <InfoItem label="Location" value={admin.location} />
            <InfoItem label="Address" value={admin.address} wide />
          </ProfileCard>

          <ProfileCard title="Work Information" subtitle="Job Details">
            <InfoItem label="Job Title" value={admin.jobTitle} />
            <InfoItem label="Department" value={admin.department} />
            <InfoItem label="Employee ID" value={admin.employeeId} />
            <InfoItem label="Join Date" value={admin.joinDate} />
            <InfoItem label="Shift" value={admin.shift} />
            <InfoItem label="Reporting To" value={admin.reportingTo} />
          </ProfileCard>

          <ProfileCard title="Account Information" subtitle="System Access">
            <InfoItem label="Username" value={admin.username} />
            <InfoItem
              label="Access Level"
              value={role?.accessLevel || admin.accessLevel}
            />
            <InfoItem
              label="Account Status"
              value={admin.accountStatus}
              success
            />
            <InfoItem label="Last Login" value={admin.lastLogin} />
            <InfoItem label="Active Sessions" value={admin.activeSessions} />
            <InfoItem label="2FA Status" value={admin.twoFactor} />
          </ProfileCard>
        </section>
      </div>
    </main>
  );
}

function ProfileCard({ title, subtitle, children }) {
  return (
    <div className="xl:col-span-6 rounded-3xl bg-white shadow-card card-border p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#333333]/70 heading-font">
          {title}
        </p>
        <h3 className="text-2xl font-bold mt-1 heading-font">{subtitle}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, wide, success }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="text-xs font-semibold text-[#333333]/70 mb-2">{label}</p>
      <div
        className={`rounded-xl bg-[#F2F2F2] px-4 py-3 text-sm leading-6 ${
          success ? "text-[#0A5E35] font-semibold" : ""
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}