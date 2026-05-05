import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, deleteUser } from "../api/usersApi";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
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

  return (
    <div className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold heading-font">Users</h1>
          <p className="muted-text mt-1">
            View, add, edit, and delete users
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
              users.map((user) => (
                <tr key={user._id} className="border-b border-[#eee]">
                  <td className="px-5 py-4 text-sm font-semibold">
                    {user.fullName || user.name}
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {user.email}
                  </td>

                  <td className="px-5 py-4 text-sm capitalize">
                    {user.role}
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {user.educationalCenter || user.center || "-"}
                  </td>

                  <td className="px-5 py-4 text-sm capitalize">
                    {user.status}
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
                        onClick={() => handleDelete(user._id)}
                        className="rounded-lg bg-brandRed text-white px-3 py-2 text-xs font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center muted-text">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}