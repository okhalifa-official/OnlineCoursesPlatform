import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import usePageTitle from "../hooks/usePageTitle";
import UserSidebar from "../components/UserSidebar";
import {
  getUserToken,
  clearUserToken,
  getUserInfo,
  saveUserInfo,
  getUserProfile,
  updateUserProfile,
  getMyEnrollments,
  userApiFetch,
} from "../api/userApi";

const NAV_LINKS = [];

const SIDEBAR_LINKS = [
  {
    label: "Dashboard",
    to: "/home",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    label: "My Courses",
    to: "/my-courses",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: "Certificates",
    to: "/certificates",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    to: "/user-profile",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

function buildInitials(fullName) {
  if (!fullName) return "?";
  return fullName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/**
 * Resize an image dataUrl to at most maxDim × maxDim pixels and re-encode
 * as JPEG at 85% quality. Keeps the file tiny enough for localStorage and
 * MongoDB while still looking sharp in the avatar circle.
 */
function resizeImage(dataUrl, maxDim = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  });
}

/** Write profileImage (+ optional extras) to localStorage and notify the navbar. */
function pushToNavbar(profileImage, extra = {}) {
  try {
    const current = getUserInfo() || {};
    saveUserInfo({ ...current, profileImage: profileImage || "", ...extra });
  } catch (_) {
    // localStorage quota exceeded — continue without caching the image
  }
  window.dispatchEvent(new Event("userInfoUpdated"));
}

export default function UserProfile() {
  usePageTitle("Profile");
  const navigate = useNavigate();

  const [profile, setProfile]         = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  // Photo-specific saving state (independent of form edit mode)
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "",
    specialty: "", yearsOfPractice: "", hospital: "", bio: "",
  });

  // Change-password section
  const [pwForm, setPwForm]     = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw]     = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    if (!getUserToken()) { navigate("/register", { replace: true }); return; }

    Promise.all([getUserProfile(), getMyEnrollments().catch(() => [])])
      .then(([data, enrolls]) => {
        setProfile(data);
        setEnrollments(Array.isArray(enrolls) ? enrolls : []);
        setForm({
          firstName:       data.firstName || data.fullName?.split(" ")[0] || "",
          lastName:        data.lastName  || data.fullName?.split(" ").slice(1).join(" ") || "",
          phone:           data.phone     || "",
          specialty:       data.specialty || "",
          yearsOfPractice: data.gradeLevel || "",
          hospital:        data.educationalCenter || "",
          bio:             data.bio       || "",
        });
        setPhotoPreview(data.profileImage || null);
        // Seed localStorage with full profile data on first visit
        pushToNavbar(data.profileImage, {
          fullName:  data.fullName,
          specialty: data.specialty || "",
          jobTitle:  data.jobTitle  || "",
          notes:     data.notes     || "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() { clearUserToken(); navigate("/login"); }

  // ── Photo: select → resize → auto-save to server immediately ─────────────
  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected

    // Read original file
    const dataUrl = await new Promise((res) => {
      const reader = new FileReader();
      reader.onload = (ev) => res(ev.target.result);
      reader.readAsDataURL(file);
    });

    // Resize to ≤400 px and re-encode as JPEG to keep size small
    const resized = await resizeImage(dataUrl, 400);

    // Show preview immediately — user sees the change right away
    setPhotoPreview(resized);
    pushToNavbar(resized); // navbar updates across the whole site instantly

    // Auto-save to server (no "Save changes" click required)
    setPhotoSaving(true);
    setError("");
    try {
      const updated = await updateUserProfile({ profileImage: resized });
      setProfile((prev) => ({ ...prev, profileImage: updated.profileImage }));
      // Keep navbar in sync with what's now confirmed on the server
      pushToNavbar(updated.profileImage);
    } catch (err) {
      setError("Photo upload failed: " + err.message);
      // Revert preview to the last known server value
      setPhotoPreview(profile?.profileImage || null);
      pushToNavbar(profile?.profileImage || null);
    } finally {
      setPhotoSaving(false);
    }
  }

  // ── Personal info ─────────────────────────────────────────────────────────
  function handleCancel() {
    if (!profile) return;
    setForm({
      firstName:       profile.firstName || profile.fullName?.split(" ")[0] || "",
      lastName:        profile.lastName  || profile.fullName?.split(" ").slice(1).join(" ") || "",
      phone:           profile.phone     || "",
      specialty:       profile.specialty || "",
      yearsOfPractice: profile.gradeLevel || "",
      hospital:        profile.educationalCenter || "",
      bio:             profile.bio       || "",
    });
    setEditing(false);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      // Photo is auto-saved on selection — no need to re-send it here
      const updated = await updateUserProfile(form);
      setProfile(updated);
      pushToNavbar(updated.profileImage, {
        fullName:  updated.fullName,
        specialty: updated.specialty || "",
        jobTitle:  updated.jobTitle  || "",
        notes:     updated.notes     || "",
      });
      setEditing(false);
      setSuccess("Profile saved.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("All fields are required."); return;
    }
    if (pwForm.next.length < 6) {
      setPwError("New password must be at least 6 characters."); return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords do not match."); return;
    }
    setPwSaving(true);
    try {
      await userApiFetch("/user/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      setPwForm({ current: "", next: "", confirm: "" });
      setPwSuccess("Password updated successfully.");
      setTimeout(() => setPwSuccess(""), 4000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  // ── Derived display values ────────────────────────────────────────────────
  const initials     = buildInitials(profile?.fullName);
  const displayName  = profile?.fullName ? `Dr. ${profile.fullName}` : "—";
  const roleSubtitle = [profile?.jobTitle, profile?.specialty].filter(Boolean).join(" · ") || profile?.role || "";
  const pocusBadge   = profile?.notes || "";
  const yearsBadge   = profile?.gradeLevel ? `${profile.gradeLevel} yrs exp.` : "";

  const fieldCls = (active) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-none ${
      active
        ? "border-gray-300 bg-white text-charcoal focus:border-brandRed"
        : "border-gray-200 bg-gray-50 text-charcoal cursor-default"
    }`;

  const pwFieldCls =
    "w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-300 bg-white text-sm text-charcoal transition focus:outline-none focus:border-brandRed";

  if (loading) {
    return (
      <div className="min-h-screen bg-softGrey">
        <UserNavbar links={NAV_LINKS} />
        <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
          <UserSidebar links={SIDEBAR_LINKS} activeLink="Profile" onLogout={handleLogout} />
          <main className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brandRed border-t-transparent rounded-full animate-spin" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softGrey">
      <UserNavbar links={NAV_LINKS} />

      <div className="flex" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
        <UserSidebar links={SIDEBAR_LINKS} activeLink="Profile" onLogout={handleLogout} />

        <main className="flex-1 flex flex-col">
          {/* Breadcrumb + search */}
          <div className="sticky top-14 z-10 bg-softGrey border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Home / <span className="text-charcoal font-medium">Profile</span>
            </p>
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search courses, lectures..." readOnly
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-charcoal placeholder-gray-300 focus:outline-none w-64" />
            </div>
          </div>

          <div className="flex-1 p-8">
            {/* Banners */}
            {success && <Banner type="success" msg={success} />}
            {error   && <Banner type="error"   msg={error}   />}

            <div className="flex gap-6 items-start">
              {/* ── Left card ── */}
              <div className="w-72 shrink-0 bg-white rounded-2xl shadow-card p-8 flex flex-col items-center text-center">
                {/* Avatar — shows spinner overlay while photo is uploading */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-brandRed flex items-center justify-center overflow-hidden shadow-md">
                    {photoPreview ? (
                      <img src={photoPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    )}
                  </div>
                  {photoSaving && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                    </div>
                  )}
                </div>

                <h2 className="font-heading font-bold text-charcoal text-xl leading-snug mb-0.5">{displayName}</h2>
                {roleSubtitle && <p className="text-gray-400 text-sm mb-3">{roleSubtitle}</p>}

                {(pocusBadge || yearsBadge) && (
                  <div className="flex flex-wrap gap-2 justify-center mb-5">
                    {pocusBadge && (
                      <span className="px-3 py-1 bg-red-50 text-brandRed text-xs font-semibold rounded-full">{pocusBadge}</span>
                    )}
                    {yearsBadge && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">{yearsBadge}</span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="w-full grid grid-cols-3 text-center pt-5 border-t border-gray-100 mb-5">
                  <div>
                    <p className="font-bold text-lg text-charcoal">0</p>
                    <p className="text-xs text-gray-400">Certificates</p>
                  </div>
                  <div className="border-x border-gray-100">
                    <p className="font-bold text-lg text-charcoal">{enrollments.length}</p>
                    <p className="text-xs text-gray-400">Courses</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-charcoal">0%</p>
                    <p className="text-xs text-gray-400">Progress</p>
                  </div>
                </div>

                {/* Hidden file input — triggered by button */}
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <button
                  onClick={() => !photoSaving && photoInputRef.current?.click()}
                  disabled={photoSaving}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal hover:bg-softGrey transition disabled:opacity-50"
                >
                  {photoSaving ? "Uploading…" : "Edit photo"}
                </button>
              </div>

              {/* ── Right column: stacked cards ── */}
              <div className="flex-1 flex flex-col gap-6">

                {/* Personal information */}
                <div className="bg-white rounded-2xl shadow-card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading font-bold text-charcoal text-lg">Personal information</h3>
                    {!editing && (
                      <button onClick={() => setEditing(true)}
                        className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-charcoal hover:bg-softGrey transition">
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="First name">
                        <input type="text" value={form.firstName} readOnly={!editing}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                          className={fieldCls(editing)} />
                      </FormField>
                      <FormField label="Last name">
                        <input type="text" value={form.lastName} readOnly={!editing}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                          className={fieldCls(editing)} />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Email">
                        <input type="email" value={profile?.email || ""} readOnly className={fieldCls(false)} />
                      </FormField>
                      <FormField label="Phone">
                        <input type="text" value={form.phone} readOnly={!editing}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          className={fieldCls(editing)} />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Specialty">
                        <input type="text" value={form.specialty} readOnly={!editing}
                          onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                          className={fieldCls(editing)} />
                      </FormField>
                      <FormField label="Years of practice">
                        <input type="text" value={form.yearsOfPractice} readOnly={!editing}
                          onChange={(e) => setForm((f) => ({ ...f, yearsOfPractice: e.target.value }))}
                          className={fieldCls(editing)} />
                      </FormField>
                    </div>

                    <FormField label="Hospital / Affiliation">
                      <input type="text" value={form.hospital} readOnly={!editing}
                        onChange={(e) => setForm((f) => ({ ...f, hospital: e.target.value }))}
                        className={fieldCls(editing)} />
                    </FormField>

                    <FormField label="Bio">
                      <textarea value={form.bio} readOnly={!editing} rows={4}
                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                        className={`${fieldCls(editing)} resize-none`} />
                    </FormField>
                  </div>

                  {editing && (
                    <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                      <button onClick={handleCancel} disabled={saving}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal hover:bg-softGrey transition disabled:opacity-50">
                        Cancel
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-brandRed text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2">
                        {saving && <Spinner />}
                        Save changes
                      </button>
                    </div>
                  )}
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-2xl shadow-card p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-brandRed" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-charcoal text-lg leading-tight">Change Password</h3>
                      <p className="text-xs text-gray-400">Minimum 6 characters</p>
                    </div>
                  </div>

                  {pwSuccess && <Banner type="success" msg={pwSuccess} className="mb-4" />}
                  {pwError   && <Banner type="error"   msg={pwError}   className="mb-4" />}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <FormField label="Current password">
                      <PasswordInput value={pwForm.current} show={showPw.current}
                        onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                        onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                        className={pwFieldCls} />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="New password">
                        <PasswordInput value={pwForm.next} show={showPw.next}
                          onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                          onToggle={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                          className={pwFieldCls} />
                      </FormField>
                      <FormField label="Confirm password">
                        <PasswordInput value={pwForm.confirm} show={showPw.confirm}
                          onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                          onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                          className={pwFieldCls} />
                      </FormField>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button type="submit" disabled={pwSaving}
                        className="px-6 py-2.5 rounded-xl bg-brandRed text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2">
                        {pwSaving && <Spinner />}
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function PasswordInput({ value, show, onChange, onToggle, className }) {
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={onChange}
        placeholder="••••••••••" className={className} />
      <button type="button" tabIndex={-1} onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal transition">
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />;
}

function Banner({ type, msg, className = "mb-5" }) {
  const isSuccess = type === "success";
  return (
    <div className={`${className} flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border ${
      isSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-brandRed"
    }`}>
      {isSuccess ? (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      )}
      {msg}
    </div>
  );
}
