import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPendingInstructors,
  approveInstructor,
  rejectInstructor,
} from "../api/usersApi";

export default function ApproveInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function loadPendingInstructors() {
    try {
      const data = await getPendingInstructors();
      setInstructors(data);
    } catch (error) {
      alert(error.message);
      console.error("Load pending instructors error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadPendingInstructors();
  }, []);

  async function handleApprove(id) {
    try {
      setActionLoadingId(id);
      await approveInstructor(id);
      await loadPendingInstructors();
    } catch (error) {
      alert(error.message);
      console.error("Approve instructor error:", error.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(id) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this instructor?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      await rejectInstructor(id);
      await loadPendingInstructors();
    } catch (error) {
      alert(error.message);
      console.error("Reject instructor error:", error.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
            Instructor Approval
          </p>
          <h1 className="text-4xl font-extrabold heading-font">
            Pending Instructors
          </h1>
          <p className="text-[#333333]/70 mt-2">
            Review instructor accounts and approve them before they become active.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl bg-[#1A1A1A] text-white px-5 py-3 text-sm font-bold heading-font"
          >
            Back to Dashboard
          </Link>

          <Link
            to="/users"
            className="rounded-xl bg-white border border-[#3333331f] text-[#1A1A1A] px-5 py-3 text-sm font-bold heading-font"
          >
            All Users
          </Link>
        </div>
      </div>

      <section className="rounded-3xl bg-white shadow-card card-border overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold heading-font">
              Approval Requests
            </h2>
            <p className="text-sm text-[#333333]/70 mt-1">
              Total pending: {instructors.length}
            </p>
          </div>

          <span className="material-symbols-outlined text-[#D62828]">
            verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1A1A1A] text-white">
              <tr>
                <th className="px-5 py-4 text-sm">Name</th>
                <th className="px-5 py-4 text-sm">Email</th>
                <th className="px-5 py-4 text-sm">Phone</th>
                <th className="px-5 py-4 text-sm">Center</th>
                <th className="px-5 py-4 text-sm">Specialty</th>
                <th className="px-5 py-4 text-sm">Status</th>
                <th className="px-5 py-4 text-sm">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-[#333333]/70"
                  >
                    Loading pending instructors...
                  </td>
                </tr>
              )}

              {!loading &&
                instructors.map((instructor) => (
                  <tr key={instructor._id} className="border-b border-[#eee]">
                    <td className="px-5 py-4 text-sm font-semibold">
                      {instructor.fullName || instructor.name || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {instructor.email || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {instructor.phone || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {instructor.educationalCenter ||
                        instructor.assignedCenter ||
                        instructor.center ||
                        "-"}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {instructor.specialty || instructor.department || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      <span className="rounded-full bg-red-50 text-[#D62828] px-3 py-1 text-xs font-bold heading-font capitalize">
                        {instructor.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(instructor._id)}
                          disabled={actionLoadingId === instructor._id}
                          className="rounded-lg bg-[#0A5E35] text-white px-3 py-2 text-xs font-bold disabled:opacity-60"
                        >
                          {actionLoadingId === instructor._id
                            ? "Saving..."
                            : "Approve"}
                        </button>

                        <button
                          onClick={() => handleReject(instructor._id)}
                          disabled={actionLoadingId === instructor._id}
                          className="rounded-lg bg-[#D62828] text-white px-3 py-2 text-xs font-bold disabled:opacity-60"
                        >
                          Reject
                        </button>

                        <Link
                          to={`/users/edit/${instructor._id}`}
                          className="rounded-lg bg-[#F2F2F2] text-[#1A1A1A] px-3 py-2 text-xs font-bold"
                        >
                          View/Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && instructors.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-[#333333]/70"
                  >
                    No pending instructors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}