import { Link } from "react-router-dom";

export const emptyCenter = {
  name: "",
  centerCode: "",
  status: "Active",
  openingDate: "",
  description: "",
  country: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  studentCapacity: "",
  activeStudents: "",
  coursesCapacity: "",
  activeCourses: "",
  classrooms: "",
  assignedManager: "",
  operatingModel: "Offline",
  certificationRate: "",
  imageUrl: "",
};

export default function EducationalCenterForm({
  mode = "add",
  formData,
  setFormData,
  onSubmit,
  loading,
}) {
  const isAddMode = mode === "add";

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold heading-font">
            {isAddMode ? "Add New Center" : "Edit Center"}
          </h1>

          <p className="muted-text mt-2 max-w-2xl">
            {isAddMode
              ? "Register a new educational center with location, operations, academic capacity, and management details."
              : "Update educational center information and operational details."}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/educational-centers"
            className="px-5 py-3 bg-white text-charcoal border border-gray-200 rounded-xl font-bold heading-font hover:bg-softGrey transition"
          >
            Back
          </Link>

          <button
            type="submit"
            form="centerForm"
            disabled={loading}
            className="px-5 py-3 bg-brandRed text-white rounded-xl font-bold heading-font hover:opacity-90 transition disabled:opacity-60"
          >
            {loading
              ? isAddMode
                ? "Saving..."
                : "Updating..."
              : isAddMode
              ? "Save Center"
              : "Update Center"}
          </button>
        </div>
      </div>

      <form id="centerForm" onSubmit={onSubmit} className="space-y-8">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
          <h2 className="text-2xl heading-font font-bold mb-6">
            Center Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Center Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Center Code"
              name="centerCode"
              value={formData.centerCode}
              onChange={handleChange}
              required
            />

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={["Active", "Maintenance", "Pending", "Inactive"]}
            />

            <Input
              label="Opening Date"
              name="openingDate"
              type="date"
              value={formatDateInput(formData.openingDate)}
              onChange={handleChange}
            />

            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              wide
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
          <h2 className="text-2xl heading-font font-bold mb-6">
            Location & Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />

            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />

            <Input
              label="Full Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              wide
            />

            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
          <h2 className="text-2xl heading-font font-bold mb-6">
            Operations & Capacity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Student Capacity"
              name="studentCapacity"
              type="number"
              value={formData.studentCapacity}
              onChange={handleChange}
            />

            <Input
              label="Active Students"
              name="activeStudents"
              type="number"
              value={formData.activeStudents}
              onChange={handleChange}
            />

            <Input
              label="Courses Capacity"
              name="coursesCapacity"
              type="number"
              value={formData.coursesCapacity}
              onChange={handleChange}
            />

            <Input
              label="Active Courses"
              name="activeCourses"
              type="number"
              value={formData.activeCourses}
              onChange={handleChange}
            />

            <Input
              label="Number of Classrooms"
              name="classrooms"
              type="number"
              value={formData.classrooms}
              onChange={handleChange}
            />

            <Input
              label="Certification Rate"
              name="certificationRate"
              type="number"
              value={formData.certificationRate}
              onChange={handleChange}
            />

            <Input
              label="Assigned Manager"
              name="assignedManager"
              value={formData.assignedManager}
              onChange={handleChange}
            />

            <Select
              label="Operating Model"
              name="operatingModel"
              value={formData.operatingModel}
              onChange={handleChange}
              options={["Offline", "Online", "Hybrid"]}
            />

            <Input
              label="Center Image URL"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </section>
      </form>
    </div>
  );
}

function formatDateInput(value) {
  if (!value) return "";

  return String(value).slice(0, 10);
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  wide = false,
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
      />
    </div>
  );
}

function Textarea({ label, name, value, onChange, wide = false }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        rows="5"
        className="w-full rounded-2xl border border-gray-200 bg-softGrey px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
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
        className="w-full h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}