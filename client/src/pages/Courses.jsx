import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCourses,
  deleteCourse,
  archiveCourse,
  restoreCourse,
} from "../api/coursesApi";
import { getAdminProfile } from "../api/adminApi";

function getTabValue(status) {
  if (status === "Published") return "published";
  if (status === "Draft") return "drafts";
  if (status === "Archived") return "archived";
  return "all";
}

function matchPrice(price, filter) {
  const value = Number(price);

  if (!filter) return true;
  if (filter === "under-100") return value < 100;
  if (filter === "100-200") return value >= 100 && value <= 200;
  if (filter === "above-200") return value > 200;

  return true;
}

function getCategoryColor(category) {
  const colors = {
    "Basic POCUS": "bg-[#1E2A61]",
    "Two Days": "bg-[#B98D36]",
    Advanced: "bg-[#885FB0]",
    Archived: "bg-[#551212]",
    General: "bg-[#046E67]",
  };

  return colors[category] || "bg-[#046E67]";
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function loadPageData() {
    try {
      const [coursesData, adminData] = await Promise.all([
        getCourses(),
        getAdminProfile(),
      ]);

      setCourses(coursesData);
      setAdmin(adminData);
    } catch (error) {
      alert(error.message);
      console.error("Load courses page error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCourses() {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      alert(error.message);
      console.error("Load courses error:", error.message);
    }
  }

  useEffect(function () {
    loadPageData();
  }, []);

  async function handleDelete(course) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${course.courseName}?`
    );

    if (!confirmed) return;

    try {
      await deleteCourse(course._id);
      await loadCourses();
    } catch (error) {
      alert(error.message);
      console.error("Delete course error:", error.message);
    }
  }

  async function handleArchive(course) {
    const confirmed = window.confirm(`Archive ${course.courseName}?`);

    if (!confirmed) return;

    try {
      await archiveCourse(course._id);
      await loadCourses();
    } catch (error) {
      alert(error.message);
      console.error("Archive course error:", error.message);
    }
  }

  async function handleRestore(course) {
    const confirmed = window.confirm(`Restore ${course.courseName}?`);

    if (!confirmed) return;

    try {
      await restoreCourse(course._id);
      await loadCourses();
    } catch (error) {
      alert(error.message);
      console.error("Restore course error:", error.message);
    }
  }

  function resetFilters() {
    setActiveTab("all");
    setSearch("");
    setCategoryFilter("");
    setPriceFilter("");
    setInstructorFilter("");
    setStatusFilter("");
  }

  const categories = useMemo(function () {
    const values = courses.map((course) => course.category || "General");
    return [...new Set(values)];
  }, [courses]);

  const instructors = useMemo(function () {
    const values = courses.map((course) => course.instructor || "Unassigned");
    return [...new Set(values)];
  }, [courses]);

  const filteredCourses = useMemo(
    function () {
      return courses.filter((course) => {
        const courseTab = getTabValue(course.publishStatus);
        const courseCategory = (course.category || "General").toLowerCase();
        const courseInstructor = (course.instructor || "Unassigned").toLowerCase();
        const courseStatus = (course.publishStatus || "").toLowerCase();

        const searchableText = [
          course.courseName,
          course.courseDescription,
          course.category,
          course.instructor,
          course.publishStatus,
          course.coursePrice,
        ]
          .join(" ")
          .toLowerCase();

        const matchTab = activeTab === "all" || courseTab === activeTab;
        const matchCategory =
          !categoryFilter || courseCategory === categoryFilter.toLowerCase();
        const matchInstructor =
          !instructorFilter || courseInstructor === instructorFilter.toLowerCase();
        const matchStatus =
          !statusFilter || courseStatus === statusFilter.toLowerCase();
        const matchSearch =
          !search.trim() || searchableText.includes(search.trim().toLowerCase());
        const matchPriceValue = matchPrice(course.coursePrice, priceFilter);

        return (
          matchTab &&
          matchCategory &&
          matchInstructor &&
          matchStatus &&
          matchSearch &&
          matchPriceValue
        );
      });
    },
    [
      courses,
      activeTab,
      categoryFilter,
      instructorFilter,
      statusFilter,
      search,
      priceFilter,
    ]
  );

  const stats = useMemo(
    function () {
      const activeStudents = courses.reduce(
        (total, course) => total + Number(course.activeStudents || 0),
        0
      );

      const totalRevenue = courses.reduce(
        (total, course) =>
          total +
          Number(course.coursePrice || 0) * Number(course.activeStudents || 0),
        0
      );

      const avgCompletion =
        courses.length === 0
          ? 0
          : Math.round(
              courses.reduce(
                (total, course) => total + Number(course.completionRate || 0),
                0
              ) / courses.length
            );

      const openTickets = courses.reduce(
        (total, course) => total + Number(course.openTickets || 0),
        0
      );

      return {
        activeStudents,
        totalRevenue,
        avgCompletion,
        openTickets,
      };
    },
    [courses]
  );

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A]">
      <header className="fixed top-0 left-72 right-0 h-20 bg-white z-40 border-b border-[#DDDDDD]">
        <div className="flex items-center justify-between h-full px-8 gap-6">
          <div className="h-12 w-44 flex items-center justify-center rounded-xl shrink-0 overflow-hidden">
            <Link to="/dashboard">
              <img
                src="/logo.png"
                alt="Sono School Logo"
                className="max-h-12 max-w-full object-contain block"
              />
            </Link>
          </div>

          <div className="flex-1 max-w-4xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#333333]">
                search
              </span>
              <input
                type="text"
                placeholder="Search courses, instructors, prices, tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] pl-12 pr-4 text-sm text-[#1A1A1A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#333333] hover:bg-[#F2F2F2] transition relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#D62828]"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-12 w-[340px] bg-white rounded-2xl border border-[#DDDDDD] shadow-card overflow-hidden z-[100]">
                  <div className="px-5 py-4 border-b border-[#DDDDDD] bg-[#fafafa]">
                    <h3 className="text-[16px] font-bold text-[#1A1A1A] heading-font">
                      Notifications
                    </h3>
                    <p className="text-[12px] text-[#666]">
                      Course activity updates
                    </p>
                  </div>

                  <div className="max-h-[340px] overflow-y-auto">
                    <NotificationItem
                      icon="menu_book"
                      title="Course management active"
                      text="Courses are connected to MongoDB."
                      red
                    />
                    <NotificationItem
                      icon="draft"
                      title="Drafts available"
                      text="Draft courses can be edited anytime."
                    />
                    <NotificationItem
                      icon="archive"
                      title="Archive enabled"
                      text="Archived courses can be restored."
                      red
                    />
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm heading-font font-semibold text-[#1A1A1A]">
                  {admin ? `${admin.firstName} ${admin.lastName}` : "Admin"}
                </p>
                <p className="text-xs text-[#333333]">
                  {admin?.jobTitle || "System Administrator"}
                </p>
              </div>

              {admin?.image ? (
                <img
                  src={admin.image}
                  alt="Admin Profile"
                  className="w-10 h-10 rounded-full object-cover border border-[#DDDDDD]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#D62828] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined">person</span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-50 h-screen w-72 bg-[#1A1A1A] text-white flex flex-col px-5 py-6 overflow-y-auto">
        <p className="text-xs tracking-[0.22em] text-[#9cb4de] mb-8 heading-font font-semibold">
          ADMIN VIEW
        </p>

        <nav className="flex flex-col gap-3 text-[15px]">
          <SideLink to="/educational-centers" icon="home" text="Educational Centers" />
          <SideLink to="/dashboard" icon="dashboard" text="Dashboard" />
          <SideLink to="/users" icon="group" text="Users" />
          <SideLink to="/courses" icon="menu_book" text="Courses" active />
          <SideLink to="/payments" icon="payments" text="Payments" />
          <SideLink to="/reports" icon="bar_chart" text="Reports" />
          <SideLink to="/settings" icon="settings" text="Settings" />
          <SideLink to="/logs" icon="receipt_long" text="Log" />
        </nav>

        <div className="mt-auto pt-5 border-t border-white/10">
          <Link
            to="/courses/add"
            className="w-full h-[58px] rounded-[22px] bg-[#D62828] text-white text-[18px] font-bold heading-font hover:bg-[#b92323] transition flex items-center justify-center"
          >
            Create Course
          </Link>
        </div>
      </aside>

      <main className="ml-72 pt-28 px-10 pb-12">
        <header className="mb-8 flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6">
          <div>
            <h1 className="heading-font text-4xl font-bold tracking-tight text-[#1A1A1A] mb-2">
              Course Management
            </h1>
            <p className="text-[#333333] text-sm max-w-md">
              Orchestrate your educational offerings, track enrollment performance, and curate the learning journey.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#e3e3e3] shadow-soft">
              <TabButton label="All Courses" value="all" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton label="Published" value="published" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton label="Drafts" value="drafts" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton label="Archived" value="archived" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="px-4 py-3 bg-white border border-[#e3e3e3] rounded-xl heading-font text-sm font-bold text-[#1A1A1A] hover:bg-[#F2F2F2] transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filters
            </button>
          </div>
        </header>

        {filtersOpen && (
          <section className="bg-white border border-[#e5e5e5] rounded-[22px] shadow-card p-6 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 rounded-xl border border-[#e5e5e5] bg-[#F2F2F2] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="h-12 rounded-xl border border-[#e5e5e5] bg-[#F2F2F2] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              >
                <option value="">All Prices</option>
                <option value="under-100">Under $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="above-200">Above $200</option>
              </select>

              <select
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="h-12 rounded-xl border border-[#e5e5e5] bg-[#F2F2F2] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              >
                <option value="">All Instructors</option>
                {instructors.map((instructor) => (
                  <option key={instructor} value={instructor}>
                    {instructor}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-xl border border-[#e5e5e5] bg-[#F2F2F2] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              >
                <option value="">All Status Types</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <button
                type="button"
                onClick={resetFilters}
                className="h-12 bg-[#1A1A1A] text-white rounded-xl heading-font text-sm font-bold hover:bg-[#D62828] transition"
              >
                Reset Filters
              </button>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatsCard label="Active Students" value={stats.activeStudents.toLocaleString()} note="+14% ↑" positive />
          <StatsCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} note="+8% ↑" positive />
          <StatsCard label="Avg. Completion" value={`${stats.avgCompletion}%`} note="Stable —" />
          <StatsCard label="Open Tickets" value={stats.openTickets} note="-2 ↓" danger />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {loading && (
            <div className="col-span-full bg-white border border-[#e5e5e5] rounded-xl shadow-card p-12 text-center">
              <p className="heading-font text-2xl font-bold text-[#1A1A1A]">
                Loading courses...
              </p>
            </div>
          )}

          {!loading &&
            filteredCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onRestore={handleRestore}
              />
            ))}

          {!loading && (
            <Link
              to="/courses/add"
              className="border-2 border-dashed border-[#d8d8d8] rounded-xl flex flex-col items-center justify-center p-12 group cursor-pointer hover:border-[#D62828] transition-all bg-white shadow-card"
            >
              <div className="w-16 h-16 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#D62828] mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <p className="heading-font text-lg font-bold text-[#1A1A1A] group-hover:text-[#D62828] transition-colors">
                Deploy New Course
              </p>
              <p className="text-[#333333] text-xs mt-2 text-center max-w-[180px]">
                Draft, configure, and launch a new educational experience
              </p>
            </Link>
          )}

          {!loading && filteredCourses.length === 0 && (
            <div className="col-span-full bg-white border border-[#e5e5e5] rounded-xl shadow-card p-12 text-center">
              <p className="heading-font text-2xl font-bold text-[#1A1A1A] mb-2">
                No courses found
              </p>
              <p className="text-[#333333] text-sm">
                Change the filters or search term and try again.
              </p>
            </div>
          )}
        </div>
      </main>

      <Link
        to="/courses/add"
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#D62828] rounded-full shadow-soft flex items-center justify-center text-white active:scale-90 transition-transform z-50"
      >
        <span className="material-symbols-outlined text-3xl">add_task</span>
      </Link>
    </div>
  );
}

function SideLink({ to, icon, text, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 rounded-xl transition ${
        active
          ? "py-4 text-white bg-[#D62828] heading-font font-semibold shadow-sm min-h-[72px]"
          : "py-3 text-gray-200 hover:bg-white/5"
      }`}
    >
      <span className="material-symbols-outlined shrink-0">{icon}</span>
      <span>{text}</span>
    </Link>
  );
}

function NotificationItem({ icon, title, text, red }) {
  return (
    <div className="flex gap-3 px-5 py-4 border-b border-[#DDDDDD] hover:bg-[#fafafa] transition">
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
          red ? "bg-red-50 text-[#D62828]" : "bg-[#EAF7EF] text-[#0A5E35]"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>

      <div>
        <p className="text-sm font-semibold heading-font text-[#1A1A1A]">
          {title}
        </p>
        <p className="text-xs text-[#666]">{text}</p>
      </div>
    </div>
  );
}

function TabButton({ label, value, activeTab, setActiveTab }) {
  const active = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 text-xs rounded-lg uppercase tracking-wider heading-font transition-colors ${
        active
          ? "bg-[#D62828] text-white font-bold"
          : "text-[#333333] font-medium hover:text-[#D62828]"
      }`}
    >
      {label}
    </button>
  );
}

function StatsCard({ label, value, note, positive, danger }) {
  return (
    <button
      type="button"
      className="bg-white p-6 rounded-xl border border-[#e5e5e5] shadow-card text-left"
    >
      <span className="text-[10px] uppercase tracking-widest block mb-1 text-[#333333]">
        {label}
      </span>

      <div className="flex items-end justify-between">
        <span className="heading-font text-3xl font-bold text-[#1A1A1A]">
          {value}
        </span>

        <span
          className={`text-xs font-bold mb-1 ${
            positive
              ? "text-[#00BF63]"
              : danger
              ? "text-[#D62828]"
              : "text-[#333333]"
          }`}
        >
          {note}
        </span>
      </div>
    </button>
  );
}

function CourseCard({ course, onDelete, onArchive, onRestore }) {
  const category = course.category || "General";
  const isArchived = course.publishStatus === "Archived";

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#e5e5e5] shadow-card group transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48">
        {course.previewImage ? (
          <img
            alt={course.courseName}
            className="w-full h-full object-cover"
            src={course.previewImage}
          />
        ) : (
          <div className="w-full h-full bg-[#F2F2F2] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#D62828] text-6xl">
              menu_book
            </span>
          </div>
        )}

        <div className="absolute top-4 left-4">
          <span
            className={`${getCategoryColor(
              category
            )} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider`}
          >
            {category}
          </span>
        </div>

        <div className="absolute top-4 right-4">
          <span
            className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              course.publishStatus === "Published"
                ? "bg-[#EAF7EF] text-[#0A5E35]"
                : course.publishStatus === "Archived"
                ? "bg-[#FFE6E6] text-[#93000A]"
                : "bg-white text-[#D62828]"
            }`}
          >
            {course.publishStatus}
          </span>
        </div>

        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Link
            to={`/courses/edit/${course._id}`}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1A1A1A] hover:text-[#D62828] transition-colors"
          >
            <span className="material-symbols-outlined">visibility</span>
          </Link>

          {!isArchived && (
            <Link
              to={`/courses/edit/${course._id}`}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1A1A1A] hover:text-[#D62828] transition-colors"
            >
              <span className="material-symbols-outlined">edit</span>
            </Link>
          )}

          {!isArchived && (
            <button
              type="button"
              onClick={() => onArchive(course)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1A1A1A] hover:text-[#D62828] transition-colors"
            >
              <span className="material-symbols-outlined">archive</span>
            </button>
          )}

          {isArchived && (
            <button
              type="button"
              onClick={() => onRestore(course)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1A1A1A] hover:text-[#D62828] transition-colors"
            >
              <span className="material-symbols-outlined">unarchive</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(course)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1A1A1A] hover:text-[#D62828] transition-colors"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        <h3 className="heading-font text-xl font-bold text-[#1A1A1A] mb-1">
          {course.courseName}
        </h3>

        <p className="text-[#333333] text-sm mb-4">
          Instructor:{" "}
          <span className="text-[#1A1A1A] font-semibold">
            {course.instructor || "Unassigned"}
          </span>
        </p>

        <p className="text-[#333333] text-xs mb-4 h-10 overflow-hidden">
          {course.courseDescription}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span
            className={`heading-font text-lg font-bold ${
              isArchived ? "text-[#333333] line-through" : "text-[#D62828]"
            }`}
          >
            ${Number(course.coursePrice || 0).toFixed(2)}
          </span>

          {isArchived ? (
            <div className="flex items-center gap-1 text-[10px] text-[#D62828] uppercase">
              <span className="material-symbols-outlined text-xs">lock</span>
              <span>Archived</span>
            </div>
          ) : course.publishStatus === "Draft" ? (
            <div className="flex items-center gap-1 text-[10px] text-[#333333] uppercase">
              <span className="material-symbols-outlined text-xs">update</span>
              <span>Draft</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-[#333333] uppercase">
              <span className="material-symbols-outlined text-xs">groups</span>
              <span>{course.activeStudents || 0} students</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}