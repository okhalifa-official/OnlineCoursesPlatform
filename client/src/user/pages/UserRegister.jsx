import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, saveUserToken, saveUserInfo } from "../api/userApi";
import UserLogo from "../components/UserLogo";

// Labels shown in the progress indicator for each step.
const STEP_LABELS = ["Your Details", "Professional Info", "Confirm"];

// All supported medical specialties sent to the server as-is.
const SPECIALTIES = [
  "Emergency Medicine", "Internal Medicine", "Cardiology", "Radiology",
  "Critical Care", "Anesthesiology", "General Surgery", "Pediatrics",
  "Obstetrics & Gynecology", "Orthopedics", "Neurology", "Oncology",
  "Nephrology", "Pulmonology", "Gastroenterology", "Rheumatology", "Other",
];

// ─── Shared sub-components ────────────────────────────────────────────────────
// These are local to this file because they are tightly coupled to the
// register wizard and not reused anywhere else.

/** Three-segment progress bar. Filled segments = steps already completed. */
function ProgressBar({ step }) {
  return (
    <div className="flex gap-1.5 mb-2">
      {STEP_LABELS.map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-brandRed" : "bg-gray-200"}`}
        />
      ))}
    </div>
  );
}

/** Label wrapper that optionally renders a red asterisk for required fields. */
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1.5">
        {label}
        {required && <span className="text-brandRed ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/** Styled text/email/tel/date input. Consistent focus ring across steps. */
function TextInput({ name, value, onChange, placeholder, type = "text", required, minLength }) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition"
    />
  );
}

/** Styled <select> wrapper. Children are <option> elements passed by the caller. */
function SelectInput({ name, value, onChange, children }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-charcoal bg-white focus:outline-none focus:border-brandRed transition"
    >
      {children}
    </select>
  );
}

/**
 * Back + Continue/Submit button pair used at the bottom of steps 2 and 3.
 * The submit button is disabled and shows a spinner when loading=true.
 */
function NavButtons({ onBack, submitLabel, loading }) {
  return (
    <div className="flex gap-3 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 border border-gray-200 text-charcoal rounded-xl py-3.5 font-semibold text-sm hover:bg-gray-50 transition"
      >
        ← Back
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-brandRed text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-red-700 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? "Creating…" : (
          <>
            {submitLabel}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

/** Single row in the step-3 summary card.
 *  Returns null when value is falsy so empty optional fields are hidden. */
function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-sm text-charcoal font-medium text-right">{value}</span>
    </div>
  );
}

// ─── Step 1: Basic Details ────────────────────────────────────────────────────

/**
 * Collects the minimum required fields: fullName, email, password, phone.
 * The Continue button submits this sub-form; no API call is made here —
 * validation happens client-side via HTML `required` + `minLength`.
 */
function StepDetails({ form, onChange, onNext }) {
  // Local state — only this step needs to know whether the password is visible.
  const [showPw, setShowPw] = useState(false);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(); }} className="space-y-4">
      <Field label="Full name" required>
        <TextInput name="fullName" value={form.fullName} onChange={onChange} placeholder="Dr. Sara Ahmed" required />
      </Field>

      <Field label="Professional email" required>
        <TextInput name="email" value={form.email} onChange={onChange} placeholder="sara.ahmed@cairohealth.com" type="email" required />
      </Field>

      <Field label="Password" required>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••••"
            required
            minLength={6}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-11 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition"
          />
          {/* Eye / eye-slash toggle — tabIndex -1 keeps keyboard flow on the input */}
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal transition"
          >
            {showPw ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </Field>

      <Field label="Phone number">
        <TextInput name="phone" value={form.phone} onChange={onChange} placeholder="+20 100 000 0000" type="tel" />
      </Field>

      <button
        type="submit"
        className="w-full bg-brandRed text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-red-700 active:scale-[0.99] transition flex items-center justify-center gap-2 mt-2"
      >
        Continue
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </form>
  );
}

// ─── Step 2: Role & Professional Info ─────────────────────────────────────────

/**
 * Collects role, gender, dateOfBirth, city, specialty, educationalCenter,
 * department, and enrollmentType (students only).
 *
 * Role is a card selector (not a dropdown) so it needs direct setForm access
 * in addition to the generic onChange handler.
 */
function StepProfessional({ form, setForm, onChange, onNext, onBack }) {
  const isInstructor = form.role === "instructor";

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(); }} className="space-y-4">
      {/* Role selector — two tappable cards instead of a dropdown */}
      <Field label="I want to join as" required>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: "student",
              label: "Student",
              sub: "Learn at your own pace",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              ),
            },
            {
              value: "instructor",
              label: "Instructor",
              sub: "Teach & create courses",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
            },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
              className={`flex flex-col items-center gap-2.5 py-5 rounded-xl border-2 transition font-medium ${
                form.role === opt.value
                  ? "border-brandRed bg-red-50 text-brandRed"
                  : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
              }`}
            >
              {opt.icon}
              <div className="text-center">
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{opt.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </Field>

      {/* Warning: instructor accounts need manual admin approval before login */}
      {isInstructor && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <p className="text-sm text-amber-700">Instructor accounts require admin approval before you can log in.</p>
        </div>
      )}

      {/* Two compact fields side by side */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gender">
          <SelectInput name="gender" value={form.gender} onChange={onChange}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </SelectInput>
        </Field>

        <Field label="Date of birth">
          <TextInput name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} type="date" />
        </Field>
      </div>

      <Field label="City">
        <TextInput name="city" value={form.city} onChange={onChange} placeholder="Cairo" />
      </Field>

      <Field label="Specialty">
        <SelectInput name="specialty" value={form.specialty} onChange={onChange}>
          <option value="">Select a specialty</option>
          {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </Field>

      {/* Label changes based on role */}
      <Field label={isInstructor ? "Institution / Center" : "Educational institution"}>
        <TextInput
          name="educationalCenter"
          value={form.educationalCenter}
          onChange={onChange}
          placeholder={isInstructor ? "Cairo University Hospital" : "Faculty of Medicine, Cairo"}
        />
      </Field>

      <Field label="Department">
        <TextInput name="department" value={form.department} onChange={onChange} placeholder="e.g. Emergency Department" />
      </Field>

      {/* Enrollment type is only relevant for students */}
      {!isInstructor && (
        <Field label="Enrollment type">
          <SelectInput name="enrollmentType" value={form.enrollmentType} onChange={onChange}>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </SelectInput>
        </Field>
      )}   

      <NavButtons onBack={onBack} submitLabel="Continue" />
    </form>
  );
}

// ─── Step 3: Review & Submit ──────────────────────────────────────────────────

/**
 * Shows a summary card of all collected fields and a terms checkbox.
 * THIS IS THE ONLY STEP THAT CALLS THE API — triggered via onSubmit.
 * The Create account button is disabled until the terms checkbox is ticked.
 */
function StepConfirm({ form, onBack, onSubmit, loading, error }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <p className="text-sm text-gray-500">Review your details before creating your account.</p>

      {/* Summary card — SummaryRow skips null/empty values automatically */}
      <div className="bg-softGrey rounded-xl p-5 space-y-3">
        <SummaryRow label="Full name"    value={form.fullName} />
        <SummaryRow label="Email"        value={form.email} />
        <SummaryRow label="Password"     value="••••••••••" />
        <SummaryRow label="Phone"        value={form.phone} />
        <SummaryRow label="Role"         value={<span className="capitalize">{form.role}</span>} />
        <SummaryRow label="Gender"       value={form.gender ? <span className="capitalize">{form.gender}</span> : null} />
        <SummaryRow label="Date of birth" value={form.dateOfBirth} />
        <SummaryRow label="City"         value={form.city} />
        <SummaryRow label="Specialty"    value={form.specialty} />
        <SummaryRow label="Institution"  value={form.educationalCenter} />
        <SummaryRow label="Department"   value={form.department} />
        {form.role === "student" && (
          <SummaryRow label="Enrollment" value={<span className="capitalize">{form.enrollmentType}</span>} />
        )}
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-brandRed rounded shrink-0"
        />
        <span className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-700 transition">
          I confirm I am a licensed medical professional and agree to the{" "}
          <span className="text-brandRed hover:underline">Terms</span> and{" "}
          <span className="text-brandRed hover:underline">Privacy Policy</span>.
        </span>
      </label>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-brandRed">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-200 text-charcoal rounded-xl py-3.5 font-semibold text-sm hover:bg-gray-50 transition"
        >
          ← Back
        </button>
        {/* Disabled until the terms checkbox is ticked */}
        <button
          type="submit"
          disabled={loading || !agreed}
          className="flex-1 bg-brandRed text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-red-700 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Creating…" : (
            <>
              Create account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

/**
 * /register — 3-step account creation wizard.
 *
 * Step 1 — Basic details (fullName, email, password, phone)
 * Step 2 — Role & professional info (role, gender, DOB, city, specialty, …)
 * Step 3 — Review summary + terms agreement → API call on submit
 *
 * The entire form state lives here in one flat object so each step can
 * read values from previous steps (needed for the step-3 summary).
 */
export default function UserRegister() {
  const navigate = useNavigate();
  // Current wizard step (1 | 2 | 3).
  const [step, setStep] = useState(1);
  // Single flat form object shared across all three steps.
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", phone: "",
    role: "student",
    gender: "", dateOfBirth: "", city: "",
    specialty: "", educationalCenter: "", department: "",
    enrollmentType: "online",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Generic onChange handler — updates a single field by name.
  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Only called from StepConfirm — the API is not touched in steps 1 or 2.
  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const data = await registerUser(form);
      saveUserToken(data.token);
      saveUserInfo(data.user);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-softGrey flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-lg p-8 md:p-10">
        {/* Card header — logo + sign-in link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <UserLogo />
          <p className="text-sm text-gray-400">
            Already a member?{" "}
            <Link to="/login" className="text-brandRed font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <h1 className="font-heading font-bold text-charcoal mb-3" style={{ fontSize: "1.75rem" }}>
          Create your account
        </h1>

        {/* Progress indicator + step label */}
        <ProgressBar step={step} />
        <p className="text-[10px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-7">
          Step {step} of 3 · {STEP_LABELS[step - 1]}
        </p>

        {/* Render only the active step */}
        {step === 1 && (
          <StepDetails form={form} onChange={handleChange} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepProfessional
            form={form}
            setForm={setForm}
            onChange={handleChange}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            form={form}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
