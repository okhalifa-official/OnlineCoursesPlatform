import { Link } from "react-router-dom";

export const emptyTrack = {
  name: "",
  description: "",
  color: "#D62828",
};

export default function TrackForm({
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
            {isAddMode ? "Add New Track" : "Edit Track"}
          </h1>

          <p className="muted-text mt-2 max-w-2xl">
            {isAddMode
              ? "Create a new course track for the home page and course catalogue."
              : "Update this track's name, description, and color."}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/tracks"
            className="px-5 py-3 bg-white text-charcoal border border-gray-200 rounded-xl font-bold heading-font hover:bg-softGrey transition"
          >
            Back
          </Link>

          <button
            type="submit"
            form="trackForm"
            disabled={loading}
            className="px-5 py-3 bg-brandRed text-white rounded-xl font-bold heading-font hover:opacity-90 transition disabled:opacity-60"
          >
            {loading
              ? isAddMode
                ? "Saving..."
                : "Updating..."
              : isAddMode
              ? "Save Track"
              : "Update Track"}
          </button>
        </div>
      </div>

      <form id="trackForm" onSubmit={onSubmit} className="space-y-8">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
          <h2 className="text-2xl heading-font font-bold mb-6">
            Track Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Track Name
              </label>

              <input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                required
                className="w-full h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Color
              </label>

              <div className="flex items-center gap-3">
                <input
                  name="color"
                  type="color"
                  value={formData.color || "#D62828"}
                  onChange={handleChange}
                  className="h-12 w-16 rounded-xl border border-gray-200 cursor-pointer"
                />

                <input
                  name="color"
                  value={formData.color || "#D62828"}
                  onChange={handleChange}
                  className="flex-1 h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-gray-200 bg-softGrey px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
