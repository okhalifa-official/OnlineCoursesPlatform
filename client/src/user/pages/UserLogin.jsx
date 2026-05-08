import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, saveUserToken, saveUserInfo } from "../api/userApi";
import { saveAdminToken, saveAdminUser } from "../../admin/api/apiClient";
import UserLogo from "../components/UserLogo";

/**
 * Reusable social-login button (Google / Apple).
 * Extracted because the same button style is used for two providers.
 */
function SocialButton({ provider, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-charcoal hover:bg-softGrey transition"
    >
      {icon}
      {provider}
    </button>
  );
}

// Pre-built SVG icons kept as constants to avoid re-rendering on each click.
const GoogleIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

/**
 * /login — Split-layout sign-in page.
 *
 * Left panel (lg+): dark gradient background, testimonial card.
 * Right panel:      email + password form with social login shortcuts.
 *
 * On success the JWT and user object are both stored in localStorage so the
 * navbar can display the user's name without an extra round-trip.
 * Social login (Google/Apple) is not yet wired up — clicking shows a
 * dismissable "coming soon" notice instead of an unresponsive button.
 */
export default function UserLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Shown when the user clicks a social button before the feature is live.
  const [socialNotice, setSocialNotice] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(form);
      saveUserToken(data.token);
      saveUserInfo(data.user);
      if (data.user.role === "admin") {
        saveAdminToken(data.token);
        saveAdminUser(data.user);
      }
      navigate(data.user.role === "admin" ? "/dashboard" : "/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSocialClick() {
    setSocialNotice(true);
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #1a1a1a 0%, #2d0404 100%)" }}
      >
        {/* Decorative concentric circles — purely visual */}
        <div className="absolute right-0 top-1/4 w-96 h-96 rounded-full border border-white/5 translate-x-1/2" />
        <div className="absolute right-0 top-1/4 w-72 h-72 rounded-full border border-white/5 translate-x-1/3" />

        <div className="relative z-10">
          <UserLogo dark />
        </div>

        <div className="relative z-10">
          <p className="text-brandRed font-semibold text-xs tracking-[0.2em] uppercase mb-4">
            Welcome Back
          </p>
          <h2 className="font-heading font-bold text-white leading-tight mb-4" style={{ fontSize: "2.25rem" }}>
            Continue your<br />
            <span className="text-gray-500">learning journey.</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            Pick up exactly where you left off — your progress,<br />
            certificates, and saved scans are waiting.
          </p>

          {/* Sample testimonial card */}
          <div className="rounded-2xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brandRed rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                NM
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Dr. Noureen Mohammed</p>
                <p className="text-gray-500 text-xs">Resident · Cairo</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm italic leading-relaxed">
              "I scanned my first patient solo on day three. The simulator-to-bedside path actually works."
            </p>
          </div>
        </div>

        <div />
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Show logo here on mobile since the left panel is hidden */}
          <div className="lg:hidden mb-8">
            <UserLogo />
          </div>

          <h1 className="font-heading font-bold text-charcoal mb-1" style={{ fontSize: "2rem" }}>
            Sign in
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            New to SonoSchool?{" "}
            <Link to="/register" className="text-brandRed font-semibold hover:underline">
              Create an account →
            </Link>
          </p>

          {/* Social login — buttons visible but feature not yet live */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <SocialButton provider="Google" icon={GoogleIcon} onClick={handleSocialClick} />
            <SocialButton provider="Apple"  icon={AppleIcon}  onClick={handleSocialClick} />
          </div>

          {/* Dismissable "coming soon" notice for social login */}
          {socialNotice && (
            <div className="flex items-center justify-between bg-softGrey border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-500 mb-3">
              <span>Social login is not yet available — use email below.</span>
              <button
                type="button"
                onClick={() => setSocialNotice(false)}
                className="ml-3 text-gray-400 hover:text-charcoal transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="sara.ahmed@cairohealth.com"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-charcoal">Password</label>
                {/* Placeholder — forgot-password flow not yet implemented */}
                <button type="button" className="text-sm text-brandRed hover:underline">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••••"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 accent-brandRed rounded" />
              <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer">
                Keep me signed in on this device
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-brandRed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brandRed text-white rounded-xl py-5 font-semibold text-base hover:bg-red-700 active:scale-[0.99] transition disabled:opacity-60 flex items-center justify-center gap-3 mt-2"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  <span>Sign in to SonoSchool</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
