import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteEducationalCenter,
  getEducationalCenters,
  getEducationalCenterStats,
} from "../api/educationalCentersApi";

export default function EducationalCenters() {
  const [centers, setCenters] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    city: "",
    size: "",
  });

  const cities = useMemo(() => {
    const uniqueCities = centers.map((center) => center.city).filter(Boolean);

    return [...new Set(uniqueCities)];
  }, [centers]);

  async function loadData() {
    try {
      setLoading(true);

      const [centersData, statsData] = await Promise.all([
        getEducationalCenters(filters),
        getEducationalCenterStats(),
      ]);

      setCenters(centersData);
      setStats(statsData);
    } catch (error) {
      alert(error.message);
      console.error("Load centers error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(
    function () {
      loadData();
    },
    [filters.status, filters.city, filters.size],
  );

  useEffect(
    function () {
      const timer = setTimeout(function () {
        loadData();
      }, 400);

      return function () {
        clearTimeout(timer);
      };
    },
    [filters.search],
  );

  function handleFilterChange(e) {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      search: "",
      status: "",
      city: "",
      size: "",
    });
  }

  async function handleDelete(center) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${center.name}?`,
    );

    if (!confirmed) return;

    try {
      await deleteEducationalCenter(center._id);
      await loadData();
    } catch (error) {
      alert(error.message);
      console.error("Delete center error:", error.message);
    }
  }

  return (
    <div className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold heading-font">
              Educational Centers
            </h1>

            <p className="muted-text mt-2 max-w-2xl">
              Manage and monitor Sono School’s learning centers, course
              delivery, instructor activities, and student engagement.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-3 bg-charcoal text-white rounded-xl font-bold heading-font flex items-center gap-2 hover:bg-brandRed transition"
            >
              <span className="material-symbols-outlined text-[20px]">
                dashboard
              </span>
              Dashboard
            </Link>

            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="px-5 py-3 bg-white text-charcoal border border-gray-200 rounded-xl font-bold heading-font flex items-center gap-2 hover:bg-softGrey transition"
            >
              <span className="material-symbols-outlined text-[20px]">
                filter_list
              </span>
              Filters
            </button>

            <Link
              to="/educational-centers/add"
              className="px-5 py-3 bg-brandRed text-white rounded-xl font-bold heading-font flex items-center gap-2 hover:opacity-90 transition"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Center
            </Link>
          </div>
        </header>

        <div className="mb-6">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-charcoal">
              search
            </span>

            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              type="text"
              placeholder="Search educational centers, courses, instructors..."
              className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-charcoal placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
            />
          </div>
        </div>

        {filtersOpen && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                className="h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
              >
                <option value="">All Locations</option>
                {cities.map((city) => (
                  <option value={city} key={city}>
                    {city}
                  </option>
                ))}
              </select>

              <select
                name="size"
                value={filters.size}
                onChange={handleFilterChange}
                className="h-12 rounded-xl border border-gray-200 bg-softGrey px-4 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
              >
                <option value="">All Sizes</option>
                <option value="large">Large Centers</option>
                <option value="medium">Medium Centers</option>
                <option value="small">Small Centers</option>
              </select>

              <button
                type="button"
                onClick={resetFilters}
                className="h-12 rounded-xl bg-charcoal text-white font-bold heading-font hover:bg-brandRed transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Total Centers"
            value={stats?.totalCenters ?? 0}
            note="+3 this quarter"
          />

          <StatCard
            label="Active Students"
            value={formatNumber(stats?.activeStudents ?? 0)}
            note="Student engagement"
          />

          <StatCard
            label="Certification Rate"
            value={`${stats?.certificationRate ?? 0}%`}
            note="Average rate"
          />

          <StatCard
            label="Global Reach"
            value={stats?.globalReach ?? 0}
            note="Countries covered"
          />
        </section>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-card">
            <p className="font-bold text-charcoal">Loading centers...</p>
          </div>
        ) : centers.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-card p-12 text-center">
            <p className="heading-font text-2xl font-bold text-charcoal mb-2">
              No centers found
            </p>

            <p className="text-sm muted-text">
              Change the search or filters and try again.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {centers.map((center) => (
              <CenterCard
                center={center}
                key={center._id}
                onDelete={handleDelete}
              />
            ))}

            <Link
              to="/educational-centers/add"
              className="group border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-4 p-8 hover:border-brandRed hover:bg-white transition min-h-[400px] bg-softGrey"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-brandRed border border-gray-200">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>

              <div className="text-center">
                <p className="heading-font font-bold text-charcoal">
                  Register New Center
                </p>

                <p className="text-xs muted-text mt-1">
                  Expansion planning and campus setup
                </p>
              </div>
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, note }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card text-left">
      <span className="text-xs heading-font font-bold text-brandRed uppercase tracking-widest">
        {label}
      </span>

      <p className="text-4xl heading-font font-extrabold text-charcoal mt-2">
        {value}
      </p>

      <p className="text-xs muted-text mt-3 flex items-center gap-1">{note}</p>
    </div>
  );
}

function CenterCard({ center, onDelete }) {
  const image =
    center.imageUrl ||
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop";

  const statusClass =
    center.status === "Active" ? "bg-brandRed" : "bg-charcoal";

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-card hover:shadow-md transition">
      <div className="h-48 relative overflow-hidden">
        <img
          alt={center.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={image}
        />

        <div
          className={`absolute top-4 right-4 px-3 py-1 ${statusClass} text-white text-[10px] heading-font font-bold uppercase rounded-full`}
        >
          {center.status}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl heading-font font-bold text-charcoal mb-1">
          {center.name}
        </h3>

        <div className="flex items-center gap-1 text-charcoal mb-6">
          <span className="material-symbols-outlined text-sm">location_on</span>

          <span className="text-xs">
            {[center.city, center.country].filter(Boolean).join(", ") || "-"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-softGrey p-3 rounded-xl">
            <p className="text-[10px] heading-font font-bold text-charcoal uppercase mb-1">
              Students
            </p>

            <p className="text-lg heading-font font-extrabold text-charcoal">
              {formatNumber(center.activeStudents || 0)}
            </p>
          </div>

          <div className="bg-softGrey p-3 rounded-xl">
            <p className="text-[10px] heading-font font-bold text-charcoal uppercase mb-1">
              Courses
            </p>

            <p className="text-lg heading-font font-extrabold text-charcoal">
              {center.activeCourses || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Link
              to={`/educational-centers/${center._id}`}
              className="w-9 h-9 rounded-lg bg-softGrey flex items-center justify-center text-charcoal hover:bg-brandRed hover:text-white transition"
            >
              <span className="material-symbols-outlined text-lg">
                visibility
              </span>
            </Link>

            <Link
              to={`/educational-centers/edit/${center._id}`}
              className="w-9 h-9 rounded-lg bg-softGrey flex items-center justify-center text-charcoal hover:bg-brandRed hover:text-white transition"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => onDelete(center)}
            className="w-9 h-9 rounded-lg bg-softGrey flex items-center justify-center text-brandRed hover:bg-brandRed hover:text-white transition"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}
