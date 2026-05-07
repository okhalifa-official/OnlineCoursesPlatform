import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, deleteUser } from "../api/usersApi";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    center: "",
  });

  async function loadUsers() {
    try {
      setLoading(true);

      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load users error:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadUsers();
  }, []);

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
      role: "",
      status: "",
      center: "",
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Are you sure you want to delete this user?");

    if (!confirmed) return;

    try {
      await deleteUser(id);
      await loadUsers();
    } catch (error) {
      console.error("Delete user error:", error.message);
      alert(error.message);
    }
  }

  function getUserName(user) {
    return (
      user.fullName ||
      user.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.username ||
      "-"
    );
  }

  function getUserRole(user) {
    if (user.role === "admin") return "Admin";
    if (user.role === "instructor") return "Instructor";
    if (user.role === "student") return "Student";
    if (user.role === "user") return "Student";

    return user.role || "-";
  }

  function getUserRoleValue(user) {
    if (user.role === "user") return "student";

    return user.role || "";
  }

  function getUserCenter(user) {
    return user.educationalCenter || user.center || "-";
  }

  function getUserStatus(user) {
    return user.status || "active";
  }

  const centers = useMemo(() => {
    const uniqueCenters = users
      .map((user) => getUserCenter(user))
      .filter((center) => center && center !== "-");

    return [...new Set(uniqueCenters)];
  }, [users]);

  const filteredUsers = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();
    const roleValue = filters.role.trim().toLowerCase();
    const statusValue = filters.status.trim().toLowerCase();
    const centerValue = filters.center.trim().toLowerCase();

    return users.filter((user) => {
      const name = getUserName(user).toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const username = String(user.username || "").toLowerCase();
      const role = getUserRoleValue(user).toLowerCase();
      const roleLabel = getUserRole(user).toLowerCase();
      const center = getUserCenter(user).toLowerCase();
      const status = getUserStatus(user).toLowerCase();

      const searchableText = [
        name,
        email,
        username,
        role,
        roleLabel,
        center,
        status,
      ].join(" ");

      const matchSearch =
        !searchValue || searchableText.includes(searchValue);

      const matchRole = !roleValue || role === roleValue;

      const matchStatus = !statusValue || status === statusValue;

      const matchCenter = !centerValue || center === centerValue;

      return matchSearch && matchRole && matchStatus && matchCenter;
    });
  }, [users, filters]);

  const userStats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      students: users.filter(
        (user) => user.role === "user" || user.role === "student"
      ).length,
      active: users.filter((user) => getUserStatus(user) === "active").length,
    };
  }, [users]);

  return (
    <div className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold heading-font">Users</h1>

          <p className="muted-text mt-1">
            View, add, edit, delete, and filter users
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl bg-charcoal text-white px-5 py-3 text-sm font-bold heading-font"
          >
            Back to Dashboard
          </Link>

          <Link
            to="/users/add"
            className="rounded-xl bg-brandRed text-white px-5 py-3 text-sm font-bold heading-font"
          >
            Add User
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={userStats.total} />
        <StatCard label="Admins" value={userStats.admins} />
        <StatCard label="Students" value={userStats.students} />
        <StatCard label="Active Users" value={userStats.active} />
      </div>

      <div className="mb-6 rounded-3xl bg-white shadow-card card-border p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
              Search
            </label>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#333333] text-[20px]">
                search
              </span>

              <input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                type="text"
                placeholder="Search by name, email, role, center..."
                className="w-full rounded-xl border border-[#ddd] px-4 py-3 pl-12 bg-[#F2F2F2] outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
              Role
            </label>

            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-[#ddd] px-4 py-3 bg-[#F2F2F2] outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
              Status
            </label>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-[#ddd] px-4 py-3 bg-[#F2F2F2] outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="reported">Reported</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
              Center
            </label>

            <select
              name="center"
              value={filters.center}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-[#ddd] px-4 py-3 bg-[#F2F2F2] outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
            >
              <option value="">All Centers</option>

              {centers.map((center) => (
                <option value={center} key={center}>
                  {center}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-[#333333]/70">
            Showing{" "}
            <span className="font-bold text-charcoal">
              {filteredUsers.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-charcoal">{users.length}</span>{" "}
            users
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl bg-charcoal text-white px-5 py-3 text-sm font-bold heading-font hover:bg-brandRed transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white shadow-card card-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-charcoal text-white">
            <tr>
              <th className="px-5 py-4 text-sm">Name</th>
              <th className="px-5 py-4 text-sm">Email</th>
              <th className="px-5 py-4 text-sm">Role</th>
              <th className="px-5 py-4 text-sm">Center</th>
              <th className="px-5 py-4 text-sm">Status</th>
              <th className="px-5 py-4 text-sm">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center muted-text">
                  Loading users...
                </td>
              </tr>
            )}

            {!loading &&
              filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-[#eee]">
                  <td className="px-5 py-4 text-sm font-semibold">
                    {getUserName(user)}
                  </td>

                  <td className="px-5 py-4 text-sm">{user.email || "-"}</td>

                  <td className="px-5 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        user.role === "admin"
                          ? "bg-red-50 text-brandRed"
                          : "bg-softGrey text-charcoal"
                      }`}
                    >
                      {getUserRole(user)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm">{getUserCenter(user)}</td>

                  <td className="px-5 py-4 text-sm capitalize">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        getUserStatus(user) === "active"
                          ? "bg-[#EAF7EF] text-[#0A5E35]"
                          : getUserStatus(user) === "reported" ||
                            getUserStatus(user) === "suspended"
                          ? "bg-red-50 text-brandRed"
                          : "bg-softGrey text-charcoal"
                      }`}
                    >
                      {getUserStatus(user)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        to={`/users/edit/${user._id}`}
                        className="rounded-lg bg-softGrey px-3 py-2 text-xs font-bold"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(user._id)}
                        className="rounded-lg bg-brandRed text-white px-3 py-2 text-xs font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center">
                  <p className="text-xl font-bold heading-font text-charcoal mb-2">
                    No users found
                  </p>

                  <p className="text-sm muted-text">
                    Change the search or filters and try again.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card card-border">
      <p className="text-xs font-bold uppercase tracking-widest text-brandRed mb-2">
        {label}
      </p>

      <h3 className="text-3xl font-extrabold heading-font text-charcoal">
        {value}
      </h3>
    </div>
  );
}