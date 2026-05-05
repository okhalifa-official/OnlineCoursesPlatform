import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../api/authApi";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "admin@sonoschool.com",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      
      await loginAdmin(formData.email, formData.password);

      navigate("/dashboard", { replace: true });
    } catch (error) {
      alert(error.message);
      console.error("Login error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl shadow-card card-border p-8"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
            <img
              src="/logo.png"
              alt="Sono School Logo"
              className="h-full w-full object-contain p-3"
            />
          </div>

          <h1 className="text-3xl font-extrabold heading-font text-[#1A1A1A]">
            Admin Login
          </h1>

          <p className="text-sm text-[#333333]/70 mt-2">
            Secure access for system administrator only.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              className="w-full rounded-xl border border-[#ddd] px-4 py-3 bg-[#F2F2F2] outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Password</label>

            <div className="relative">
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-[#ddd] px-4 py-3 pr-12 bg-[#F2F2F2] outline-none focus:ring-2 focus:ring-[#D62828]/20 focus:border-[#D62828]"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333]"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#D62828] text-white py-3 font-bold heading-font disabled:opacity-60 hover:bg-[#B92323] transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </main>
  );
}