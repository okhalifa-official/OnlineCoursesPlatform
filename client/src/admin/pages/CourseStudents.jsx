import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCourseById,
  getCourseStudents,
  resetExamAttempts,
  unenrollStudent,
  uploadStudentCertificate,
  removeStudentCertificate,
} from "../api/coursesApi";

export default function CourseStudents() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [meta, setMeta] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [certBusyId, setCertBusyId] = useState(null);
  const fileInputRef = useRef(null);
  const pendingEnrollmentRef = useRef(null);

  function load() {
    setLoading(true);
    setError("");
    Promise.all([getCourseById(id), getCourseStudents(id)])
      .then(([courseData, studentsData]) => {
        setCourse(courseData);
        setMeta(studentsData.course);
        setStudents(studentsData.students || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleResetAttempts(enrollmentId) {
    if (!window.confirm("Reset this student's exam attempts back to 0?")) return;
    try {
      setBusyId(enrollmentId);
      await resetExamAttempts(id, enrollmentId);
      // Optimistic local update so we don't refetch the whole list.
      setStudents((list) =>
        list.map((s) =>
          s._id === enrollmentId ? { ...s, examAttemptsUsed: 0 } : s
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function openCertUpload(enrollmentId) {
    pendingEnrollmentRef.current = enrollmentId;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  async function handleCertFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !pendingEnrollmentRef.current) return;
    const enrollmentId = pendingEnrollmentRef.current;
    pendingEnrollmentRef.current = null;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setCertBusyId(enrollmentId);
        const base64 = reader.result.split(",")[1];
        await uploadStudentCertificate(id, enrollmentId, {
          name: file.name,
          mimeType: file.type,
          data: base64,
        });
        setStudents((list) =>
          list.map((s) =>
            s._id === enrollmentId
              ? { ...s, hasCertificate: true, certificateUploadedAt: new Date().toISOString() }
              : s
          )
        );
      } catch (err) {
        alert(err.message);
      } finally {
        setCertBusyId(null);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleRemoveCert(enrollmentId) {
    if (!window.confirm("Remove the uploaded certificate for this student?")) return;
    try {
      setCertBusyId(enrollmentId);
      await removeStudentCertificate(id, enrollmentId);
      setStudents((list) =>
        list.map((s) =>
          s._id === enrollmentId
            ? { ...s, hasCertificate: false, certificateUploadedAt: null }
            : s
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setCertBusyId(null);
    }
  }

  async function handleUnenroll(enrollmentId) {
    if (
      !window.confirm(
        "Remove this student from the course? They will lose access immediately."
      )
    )
      return;
    try {
      setBusyId(enrollmentId);
      await unenrollStudent(id, enrollmentId);
      setStudents((list) => list.filter((s) => s._id !== enrollmentId));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const filtered = students.filter((s) => {
    if (!search) return true;
    const u = s.user || {};
    const haystack = `${u.fullName || ""} ${u.email || ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] pt-10 pb-16 px-6">
      {/* Hidden file input for certificate uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleCertFileChange}
      />
      <div className="max-w-6xl mx-auto">
        <Link
          to="/admin/courses"
          className="inline-flex items-center text-[#D62828] text-sm font-medium mb-4 hover:gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
          Back to Courses
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight leading-none mb-2 heading-font">
            Manage Students
          </h1>
          <p className="text-[#333333] text-sm">
            {course
              ? <>For <span className="font-semibold">{course.courseName}</span></>
              : "Loading…"}
          </p>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Enrolled" value={students.length} />
          <StatCard
            label="Avg. progress"
            value={
              students.length === 0
                ? "0%"
                : `${Math.round(
                    students.reduce((s, st) => s + (st.progressPercent || 0), 0) /
                      students.length
                  )}%`
            }
          />
          <StatCard
            label="Exam passed"
            value={students.filter((s) => s.examPassed).length}
          />
          <StatCard
            label="Pass mark"
            value={meta?.examPassingScore != null ? `${meta.examPassingScore}%` : "—"}
          />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-card border border-[#E4E4E4] p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <span className="material-symbols-outlined text-sm absolute left-3 top-1/2 -translate-y-1/2 text-[#666]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
            />
          </div>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2.5 rounded-lg bg-[#F7F7F7] hover:bg-white border border-[#E4E4E4] text-sm font-semibold inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow-card border border-[#E4E4E4] p-8 text-center text-sm text-[#666]">
            Loading students…
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-[#D62828] text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-xl shadow-card border border-[#E4E4E4] p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-[#D6D6D6]">
              group
            </span>
            <p className="mt-2 text-sm font-bold">
              {search ? "No students match this search" : "No students enrolled yet"}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-xl shadow-card border border-[#E4E4E4] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] border-b border-[#E4E4E4] text-[10px] font-bold uppercase tracking-widest text-[#666]">
                  <tr>
                    <th className="px-5 py-3 text-left">Student</th>
                    <th className="px-5 py-3 text-left">Progress</th>
                    <th className="px-5 py-3 text-left">Exam attempts</th>
                    <th className="px-5 py-3 text-left">Best score</th>
                    <th className="px-5 py-3 text-left">Certificate</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const u = s.user || {};
                    const initials = (u.fullName || "?")
                      .split(/\s+/)
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const attemptsLeft = Math.max(
                      0,
                      (s.examMaxAttempts || 1) - (s.examAttemptsUsed || 0)
                    );

                    return (
                      <tr key={s._id} className="border-b border-[#F0F0F0] last:border-0">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#D62828] flex items-center justify-center overflow-hidden shrink-0">
                              {u.profileImage ? (
                                <img
                                  src={u.profileImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-white">
                                  {initials}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">
                                {u.fullName || "Unknown user"}
                              </p>
                              <p className="text-xs text-[#666] truncate">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 max-w-[180px]">
                            <div className="flex-1 h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
                              <div
                                className="h-full bg-[#D62828] transition-all"
                                style={{ width: `${s.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#1A1A1A] w-16 text-right">
                              {s.completedLectures}/{s.totalLectures} ·{" "}
                              {s.progressPercent}%
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${
                              attemptsLeft === 0
                                ? "bg-[#FFE6E6] text-[#93000A]"
                                : "bg-[#FAFAFA] text-[#1A1A1A]"
                            }`}
                          >
                            {s.examAttemptsUsed || 0} / {s.examMaxAttempts}
                            <span className="text-[10px] font-normal text-[#666]">
                              ({attemptsLeft} left)
                            </span>
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {s.examAttemptsUsed > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${
                                s.examPassed
                                  ? "bg-[#EAF7EF] text-[#0A5E35]"
                                  : "bg-[#FFE6E6] text-[#93000A]"
                              }`}
                            >
                              {s.examBestScore}%
                              <span className="text-[10px] font-normal">
                                {s.examPassed ? "Passed" : "Failed"}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-[#666]">— Not taken</span>
                          )}
                        </td>

                        {/* Certificate column */}
                        <td className="px-5 py-4">
                          {s.hasCertificate ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[#EAF7EF] text-[#0A5E35]">
                              <span className="material-symbols-outlined text-sm">verified</span>
                              Issued
                            </span>
                          ) : (
                            <span className="text-xs text-[#999]">— None</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleResetAttempts(s._id)}
                              disabled={busyId === s._id || !meta?.examEnabled}
                              title={
                                meta?.examEnabled
                                  ? "Grant another exam attempt"
                                  : "Exam isn't enabled for this course"
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FAFAFA] border border-[#E4E4E4] hover:border-[#D62828] hover:text-[#D62828] transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Reset attempts
                            </button>
                            {s.hasCertificate ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveCert(s._id)}
                                disabled={certBusyId === s._id}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#D62828] hover:bg-[#FFE6E6] transition disabled:opacity-40"
                              >
                                {certBusyId === s._id ? "Removing…" : "Remove cert"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openCertUpload(s._id)}
                                disabled={certBusyId === s._id}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FAFAFA] border border-[#E4E4E4] hover:border-[#0A5E35] hover:text-[#0A5E35] transition disabled:opacity-40"
                              >
                                {certBusyId === s._id ? "Uploading…" : "Upload cert"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUnenroll(s._id)}
                              disabled={busyId === s._id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#D62828] hover:bg-[#FFE6E6] transition disabled:opacity-40"
                            >
                              Unenroll
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-[#E4E4E4] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-1">
        {label}
      </p>
      <p className="text-2xl font-black heading-font">{value}</p>
    </div>
  );
}
