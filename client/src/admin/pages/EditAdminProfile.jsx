import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminProfile, updateAdminProfile } from "../api/adminApi";

export default function EditAdminProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(function () {
    async function loadAdmin() {
      try {
        const data = await getAdminProfile();

        setFormData({
          ...data,
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        alert(error.message);
        console.error("Load admin error:", error.message);
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, []);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = function () {
      setFormData({
        ...formData,
        image: reader.result,
      });
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setSaving(true);

      const dataToSend = {
        ...formData,
        password: formData.newPassword,
      };

      delete dataToSend.newPassword;
      delete dataToSend.confirmPassword;
      delete dataToSend._id;
      delete dataToSend.createdAt;
      delete dataToSend.updatedAt;
      delete dataToSend.__v;

      if (!dataToSend.password) {
        delete dataToSend.password;
      }

      await updateAdminProfile(dataToSend);

      alert("Admin profile updated successfully");
      navigate("/profile");
    } catch (error) {
      alert(error.message);
      console.error("Update admin error:", error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="font-bold text-[#1A1A1A]">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] px-6 py-10 lg:px-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 text-[#D62828] text-sm font-semibold heading-font hover:underline mb-3"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Back to Profile
            </Link>

            <h1 className="text-4xl font-extrabold heading-font">
              Edit Admin Profile
            </h1>

            <p className="text-sm text-[#333333]/70 mt-2">
              Update personal data, profile image, and account credentials.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/profile"
              className="rounded-xl bg-white border border-[#3333331f] text-[#1A1A1A] px-5 py-3 text-sm font-semibold heading-font hover:bg-[#f7f7f7] transition"
            >
              Cancel
            </Link>

            <button
              form="edit-admin-profile-form"
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#D62828] text-white px-5 py-3 text-sm font-semibold heading-font hover:bg-[#B92323] transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <form
          id="edit-admin-profile-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-3xl bg-white shadow-card card-border p-6">
            <SectionTitle title="Profile Picture" subtitle="Photo Settings" />

            <div className="flex flex-col md:flex-row items-start gap-6">
              {formData.image ? (
                <img
                  src={formData.image}
                  alt="Admin User"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-[#D62828] text-white flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="material-symbols-outlined text-[48px]">
                    person
                  </span>
                </div>
              )}

              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#333333]/70 mb-2">
                  Upload New Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-xl border border-[#3333331f] bg-[#F2F2F2] px-4 py-3 text-sm"
                />
                <p className="text-xs text-[#333333]/70 mt-2">
                  Allowed formats: JPG, PNG. Recommended size: 500x500px.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-card card-border p-6">
            <SectionTitle
              title="Personal Details"
              subtitle="Basic Information"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />

              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />

              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={["Male", "Female"]}
              />

              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#333333]/70 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-xl border border-[#3333331f] bg-[#F2F2F2] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-card card-border p-6">
            <SectionTitle
              title="Contact Details"
              subtitle="Communication Info"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />

              <Input
                label="Office Number"
                name="office"
                value={formData.office}
                onChange={handleChange}
              />

              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-card card-border p-6">
            <SectionTitle title="Work Information" subtitle="Job Details" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Job Title"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
              />

              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />

              <Input
                label="Employee ID"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
              />

              <Input
                label="Join Date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
              />

              <Input
                label="Shift"
                name="shift"
                value={formData.shift}
                onChange={handleChange}
              />

              <Input
                label="Reporting To"
                name="reportingTo"
                value={formData.reportingTo}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-card card-border p-6">
            <SectionTitle
              title="Account Security"
              subtitle="Password & Access"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />

              <Select
                label="Access Level"
                name="accessLevel"
                value={formData.accessLevel}
                onChange={handleChange}
                options={["Super Admin", "Admin", "Manager"]}
              />

              <Select
                label="Account Status"
                name="accountStatus"
                value={formData.accountStatus}
                onChange={handleChange}
                options={["Active", "Inactive", "Suspended"]}
              />

              <Select
                label="2FA Status"
                name="twoFactor"
                value={formData.twoFactor}
                onChange={handleChange}
                options={["Enabled", "Disabled"]}
              />

              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
          </section>

          <div className="flex justify-end gap-3 pb-4">
            <Link
              to="/profile"
              className="rounded-xl bg-white border border-[#3333331f] text-[#1A1A1A] px-5 py-3 text-sm font-semibold heading-font hover:bg-[#f7f7f7] transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#D62828] text-white px-5 py-3 text-sm font-semibold heading-font hover:bg-[#B92323] transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-[#333333]/70 heading-font">
        {title}
      </p>
      <h2 className="text-2xl font-bold mt-1 heading-font">{subtitle}</h2>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#333333]/70 mb-2">
        {label}
      </label>

      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#3333331f] bg-[#F2F2F2] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#333333]/70 mb-2">
        {label}
      </label>

      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full rounded-xl border border-[#3333331f] bg-[#F2F2F2] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}