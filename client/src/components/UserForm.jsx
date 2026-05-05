import { Link } from "react-router-dom";

const emptyUser = {
  fullName: "",
  email: "",
  phone: "",
  nationalId: "",
  password: "",
  confirmPassword: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  city: "",
  profileImageName: "",
  role: "student",
  status: "active",
  username: "",
  joinDate: "",
  permissionsLevel: "basic",
  enrollmentType: "online",
  educationalCenter: "",
  department: "",
  gradeLevel: "",
  emergencyContact: "",
  registeredCourses: [],
  courseStatus: "registered",
  courseStartDate: "",
  courseEndDate: "",
  parentContact: "",
  teachingCourses: [],
  specialty: "",
  assignedCenter: "",
  teachingStatus: "assigned",
  managedCenters: [],
  managedCourses: [],
  notes: "",
};

const courses = [
  "Mathematics Basics",
  "Advanced Physics",
  "English Grammar",
  "Biology Foundations",
  "Programming 101",
  "UI/UX Design",
];

const centers = ["Main Center", "October Branch", "Zayed Branch", "Online Center"];

export default function UserForm({
  mode = "add",
  formData,
  setFormData,
  onSubmit,
  loading,
}) {
  const data = formData || emptyUser;

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...data,
      [name]: value,
    });
  }

  function handleMultiChange(e) {
    const { name, selectedOptions } = e.target;

    const values = Array.from(selectedOptions).map((option) => option.value);

    setFormData({
      ...data,
      [name]: values,
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];

    setFormData({
      ...data,
      profileImageName: file ? file.name : "",
    });
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A]">
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="heading-font text-4xl font-extrabold tracking-tight">
              {mode === "add" ? "Add New User" : "Edit User"}
            </h1>

            <p className="text-[#333333] text-lg">
              {mode === "add"
                ? "Create a complete user profile with role, educational center, and course assignments."
                : "Update user details, center, role, and assigned courses."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/users"
              className="bg-white text-[#1A1A1A] px-5 py-3 rounded-2xl font-semibold border border-[#E5E5E5] hover:bg-[#fafafa] transition"
            >
              Back to Users
            </Link>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <section className="form-card">
            <SectionTitle
              title="Personal Information"
              text="Basic user details and identity information."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" name="fullName" value={data.fullName} onChange={handleChange} required />
              <Input label="Email Address" name="email" type="email" value={data.email} onChange={handleChange} required />
              <Input label="Phone Number" name="phone" value={data.phone} onChange={handleChange} />
              <Input label="National ID / User ID" name="nationalId" value={data.nationalId} onChange={handleChange} />

              {mode === "add" && (
                <>
                  <Input label="Password" name="password" type="password" value={data.password} onChange={handleChange} />
                  <Input label="Confirm Password" name="confirmPassword" type="password" value={data.confirmPassword} onChange={handleChange} />
                </>
              )}

              <Select
                label="Gender"
                name="gender"
                value={data.gender}
                onChange={handleChange}
                options={[
                  { label: "Select gender", value: "" },
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                ]}
              />

              <Input label="Date of Birth" name="dateOfBirth" type="date" value={data.dateOfBirth} onChange={handleChange} />

              <div className="md:col-span-2">
                <Input label="Address" name="address" value={data.address} onChange={handleChange} />
              </div>

              <Input label="City / Governorate" name="city" value={data.city} onChange={handleChange} />

              <div>
                <label className="block text-sm font-semibold mb-2">Profile Image</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full h-12 rounded-xl border border-[#E5E5E5] px-3 py-2 bg-[#F2F2F2] focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
                />
              </div>
            </div>
          </section>

          <section className="form-card">
            <SectionTitle
              title="Account & Role"
              text="Define the user role, account status, and access level."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Role"
                name="role"
                value={data.role}
                onChange={handleChange}
                options={[
                  { label: "Student", value: "student" },
                  { label: "Instructor", value: "instructor" },
                  { label: "Admin", value: "admin" },
                ]}
              />

              <Select
                label="Account Status"
                name="status"
                value={data.status}
                onChange={handleChange}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Pending", value: "pending" },
                  { label: "Suspended", value: "suspended" },
                ]}
              />

              <Input label="Username" name="username" value={data.username} onChange={handleChange} />
              <Input label="Join Date" name="joinDate" type="date" value={data.joinDate} onChange={handleChange} />

              <Select
                label="Permissions Level"
                name="permissionsLevel"
                value={data.permissionsLevel}
                onChange={handleChange}
                options={[
                  { label: "Basic", value: "basic" },
                  { label: "Moderate", value: "moderate" },
                  { label: "Full Access", value: "full" },
                ]}
              />

              <Select
                label="Enrollment Type"
                name="enrollmentType"
                value={data.enrollmentType}
                onChange={handleChange}
                options={[
                  { label: "Online", value: "online" },
                  { label: "Offline", value: "offline" },
                  { label: "Hybrid", value: "hybrid" },
                ]}
              />
            </div>
          </section>

          <section className="form-card">
            <SectionTitle
              title="Educational Information"
              text="Assign the user to educational centers, departments, and learning mode."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Educational Center"
                name="educationalCenter"
                value={data.educationalCenter}
                onChange={handleChange}
                options={[
                  { label: "Select center", value: "" },
                  ...centers.map((center) => ({ label: center, value: center })),
                ]}
              />

              <Input label="Department / Program" name="department" value={data.department} onChange={handleChange} />
              <Input label="Grade / Level" name="gradeLevel" value={data.gradeLevel} onChange={handleChange} />
              <Input label="Emergency Contact" name="emergencyContact" value={data.emergencyContact} onChange={handleChange} />
            </div>
          </section>

          <section className="form-card">
            <SectionTitle
              title="Courses Assignment"
              text="Assign courses based on whether the user is studying, teaching, or managing them."
            />

            {data.role === "student" && (
              <RoleBlock title="Student Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MultiSelect
                    label="Registered Courses"
                    name="registeredCourses"
                    value={data.registeredCourses}
                    onChange={handleMultiChange}
                    options={courses}
                  />

                  <div>
                    <Select
                      label="Current Course Status"
                      name="courseStatus"
                      value={data.courseStatus}
                      onChange={handleChange}
                      options={[
                        { label: "Registered", value: "registered" },
                        { label: "Current", value: "current" },
                        { label: "Completed", value: "completed" },
                      ]}
                    />

                    <div className="mt-4">
                      <Input label="Course Start Date" name="courseStartDate" type="date" value={data.courseStartDate} onChange={handleChange} />
                    </div>

                    <div className="mt-4">
                      <Input label="Course End Date" name="courseEndDate" type="date" value={data.courseEndDate} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Input label="Parent Contact" name="parentContact" value={data.parentContact} onChange={handleChange} />
                  </div>
                </div>
              </RoleBlock>
            )}

            {data.role === "instructor" && (
              <RoleBlock title="Instructor Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MultiSelect
                    label="Teaching Courses"
                    name="teachingCourses"
                    value={data.teachingCourses}
                    onChange={handleMultiChange}
                    options={courses}
                  />

                  <div>
                    <Input label="Specialty / Subject Area" name="specialty" value={data.specialty} onChange={handleChange} />

                    <div className="mt-4">
                      <Select
                        label="Assigned Center"
                        name="assignedCenter"
                        value={data.assignedCenter}
                        onChange={handleChange}
                        options={centers.map((center) => ({ label: center, value: center }))}
                      />
                    </div>

                    <div className="mt-4">
                      <Select
                        label="Teaching Status"
                        name="teachingStatus"
                        value={data.teachingStatus}
                        onChange={handleChange}
                        options={[
                          { label: "Assigned", value: "assigned" },
                          { label: "Currently Teaching", value: "currently_teaching" },
                          { label: "Completed", value: "completed" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </RoleBlock>
            )}

            {data.role === "admin" && (
              <RoleBlock title="Admin Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MultiSelect
                    label="Managed Educational Centers"
                    name="managedCenters"
                    value={data.managedCenters}
                    onChange={handleMultiChange}
                    options={centers}
                  />

                  <MultiSelect
                    label="Managed Courses"
                    name="managedCourses"
                    value={data.managedCourses}
                    onChange={handleMultiChange}
                    options={courses}
                  />
                </div>
              </RoleBlock>
            )}

            <div className="mt-6">
              <label className="block text-sm font-semibold mb-2">Notes / Bio</label>
              <textarea
                name="notes"
                value={data.notes}
                onChange={handleChange}
                rows="5"
                className="w-full rounded-2xl border border-[#E5E5E5] px-4 py-3 bg-[#F2F2F2] focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              />
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#D62828] text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-95 transition shadow-[0_10px_30px_rgba(0,0,0,0.06)] disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : mode === "add"
                ? "Create User"
                : "Save Changes"}
            </button>

            <button
              type="reset"
              className="bg-white text-[#1A1A1A] px-6 py-3 rounded-2xl font-semibold border border-[#E5E5E5] hover:bg-[#fafafa] transition"
            >
              Reset Form
            </button>

            <Link
              to="/users"
              className="bg-white text-[#1A1A1A] px-6 py-3 rounded-2xl font-semibold border border-[#E5E5E5] hover:bg-[#fafafa] transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionTitle({ title, text }) {
  return (
    <div className="mb-6">
      <h2 className="heading-font text-2xl font-bold">{title}</h2>
      <p className="text-sm text-[#333333] mt-1">{text}</p>
    </div>
  );
}

function RoleBlock({ title, children }) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="heading-font text-xl font-bold mb-1">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        type={type}
        required={required}
        className="w-full h-12 rounded-xl border border-[#E5E5E5] px-4 bg-[#F2F2F2] focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full h-12 rounded-xl border border-[#E5E5E5] px-4 bg-[#F2F2F2] focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MultiSelect({ label, name, value = [], onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <select
        multiple
        name={name}
        value={value}
        onChange={onChange}
        className="w-full min-h-[160px] rounded-2xl border border-[#E5E5E5] px-4 py-3 bg-[#F2F2F2] focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
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

export { emptyUser };