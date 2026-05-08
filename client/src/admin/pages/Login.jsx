import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUnified } from "../api/authApi";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    keepSignedIn: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const username = formData.username.trim();
    const password = formData.password;

    if (!username || !password) {
      alert("Email/username and password are required");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUnified(username, password);

      navigate(result.redirectTo, { replace: true });
    } catch (error) {
      alert(error.message || "Login failed");
      console.error("Login error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex">
      <section className="hidden lg:flex w-[46%] bg-[#170B0E] text-white px-10 py-9 flex-col justify-between relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[#D62828] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">
              school
            </span>
          </div>

          <p className="text-lg font-extrabold heading-font">
            Sono<span className="text-[#D62828]">School</span>
          </p>
        </div>

        <div>
          <p className="text-[#D62828] tracking-[0.35em] text-[11px] font-bold uppercase mb-7">
            Welcome Back
          </p>

          <h1 className="text-4xl font-extrabold heading-font leading-tight mb-7">
            Continue your
            <br />
            <span className="text-white/45">learning journey.</span>
          </h1>

          <p className="text-white/70 text-base max-w-md leading-7">
            Pick up exactly where you left off — your progress, certificates,
            and saved scans are waiting.
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-5 max-w-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-11 w-11 rounded-full bg-[#D62828] flex items-center justify-center font-bold text-sm">
              NM
            </div>

            <div>
              <p className="font-bold text-sm">Dr. Noureen Mohammed</p>
              <p className="text-xs text-white/50">Resident · Cairo</p>
            </div>
          </div>

          <p className="italic text-white/90 text-sm leading-6">
            "I scanned my first patient solo on day three. The
            simulator-to-bedside path actually works."
          </p>
        </div>
      </section>

      <section className="w-full lg:w-[54%] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] heading-font">
              Sign in
            </h1>

            <p className="mt-3 text-sm text-[#8B95A1]">
              New to SonoSchool?{" "}
              <Link to="/register" className="text-[#D62828] font-medium">
                Create an account →
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="h-12 rounded-xl border border-[#DDDDDD] bg-white flex items-center justify-center gap-3 text-base font-medium text-[#333333] hover:bg-[#F7F7F7] transition"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              className="h-12 rounded-xl border border-[#DDDDDD] bg-white flex items-center justify-center gap-3 text-base font-medium text-[#333333] hover:bg-[#F7F7F7] transition"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16.365 1.43c0 1.14-.42 2.13-1.26 2.97-.9.9-1.89 1.38-2.97 1.29-.12-1.08.3-2.07 1.14-2.94.84-.84 1.95-1.35 3.09-1.32zM20.79 17.34c-.48 1.11-.72 1.59-1.35 2.58-.87 1.32-2.1 2.97-3.63 2.97-1.35 0-1.71-.87-3.54-.87-1.83 0-2.25.84-3.51.9-1.5.06-2.64-1.44-3.51-2.76-2.4-3.66-2.67-7.95-1.17-10.23 1.05-1.62 2.73-2.58 4.29-2.58 1.59 0 2.58.87 3.9.87 1.26 0 2.04-.87 3.87-.87 1.38 0 2.85.75 3.9 2.04-3.42 1.86-2.85 6.72.26 7.95z" />
              </svg>
              Apple
            </button>
          </div>

          <div className="relative mb-6">
            <div className="h-px bg-[#DDDDDD]"></div>

            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[11px] tracking-[0.22em] text-[#8B95A1] uppercase whitespace-nowrap">
              Or continue with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-base font-medium text-[#333333] mb-2">
                Email address
              </label>

              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                type="text"
                autoComplete="username"
                required
                className="w-full h-12 rounded-xl border border-[#D7DFEA] bg-[#EEF4FF] px-4 text-base text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
                placeholder="admin@sonoschool.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-base font-medium text-[#333333]">
                  Password
                </label>

                <button
                  type="button"
                  className="text-base font-medium text-[#D62828]"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full h-12 rounded-xl border border-[#D7DFEA] bg-[#EEF4FF] px-4 pr-12 text-base text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
                  placeholder="Enter password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 text-base text-[#6B7280]">
              <input
                name="keepSignedIn"
                checked={formData.keepSignedIn}
                onChange={handleChange}
                type="checkbox"
                className="w-4 h-4 accent-[#D62828]"
              />
              Keep me signed in on this device
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-[#D62828] text-white text-base font-bold heading-font hover:bg-[#B92323] transition disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {loading ? "Signing in..." : "Sign in to SonoSchool"}

              {!loading && (
                <span className="material-symbols-outlined text-[24px]">
                  arrow_forward
                </span>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
