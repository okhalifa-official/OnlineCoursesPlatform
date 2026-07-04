import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentLayout from "../components/StudentLayout";

const API_BASE = "http://localhost:4000/api";
const MAX_FILE_BYTES = 6 * 1024 * 1024;

function getStoredAuthToken() {
  if (typeof window === "undefined") return "";
  const candidates = ["token", "userToken", "adminToken"];
  for (const key of candidates) {
    const localValue = window.localStorage?.getItem(key);
    if (localValue) return localValue;
    const sessionValue = window.sessionStorage?.getItem(key);
    if (sessionValue) return sessionValue;
  }
  return "";
}

function getQueryParams() {
  if (typeof window === "undefined") return { courseId: "", paymentRef: "" };
  const searchParams = new URLSearchParams(window.location.search);
  return {
    courseId: searchParams.get("courseId") || "",
    paymentRef: searchParams.get("paymentRef") || "",
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const query = useMemo(() => getQueryParams(), []);
  const authToken = useMemo(() => getStoredAuthToken(), []);

  const [phase, setPhase] = useState("form");
  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("instapay");
  const [instapayConfig, setInstapayConfig] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [instapayResult, setInstapayResult] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function loadCourse() {
      if (!query.courseId) {
        setCourseLoading(false);
        setError("A courseId query parameter is required to open checkout.");
        return;
      }
      setCourseLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_BASE}/user/courses/${query.courseId}`);
        if (!ignore) setCourse(response.data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || "Failed to load the selected course.");
      } finally {
        if (!ignore) setCourseLoading(false);
      }
    }
    loadCourse();
    return () => { ignore = true; };
  }, [query.courseId]);

  useEffect(() => {
    let ignore = false;
    async function loadConfig() {
      try {
        const response = await axios.get(`${API_BASE}/user/payments/instapay/config`);
        if (!ignore) setInstapayConfig(response.data);
      } catch (e) {}
    }
    loadConfig();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (phase !== "verified") return;
    setCountdown(4);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/home", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, navigate]);

  async function handleScreenshotSelected(event) {
    const file = event.target.files?.[0];
    setInstapayResult(null);
    if (!file) {
      setScreenshotFile(null);
      setScreenshotPreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG or JPG).");
      setScreenshotFile(null);
      setScreenshotPreview("");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`Screenshot is too large (max ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))} MB).`);
      setScreenshotFile(null);
      setScreenshotPreview("");
      return;
    }
    setError("");
    setScreenshotFile(file);
    try {
      const dataUrl = await fileToBase64(file);
      setScreenshotPreview(dataUrl);
    } catch {
      setError("Failed to read the screenshot file.");
      setScreenshotFile(null);
      setScreenshotPreview("");
    }
  }

  async function handleInstapaySubmit() {
    if (!authToken) { setError("Please sign in before submitting a payment."); return; }
    if (!query.courseId || !screenshotPreview) { setError("Please upload the InstaPay screenshot."); return; }

    setPhase("submitting");
    setError("");
    setInstapayResult(null);

    try {
      const response = await axios.post(
        `${API_BASE}/user/payments/instapay/submit`,
        { courseId: query.courseId, screenshotBase64: screenshotPreview },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setInstapayResult(response.data);
      const status = response.data?.status;
      if (status === "verified") setPhase("verified");
      else if (status === "rejected") setPhase("rejected");
      else setPhase("pending");
    } catch (requestError) {
      const status = requestError.response?.status;
      const message = requestError.response?.data?.message;
      if (status === 502) {
        setInstapayResult({ status: "rejected", reasons: ["We couldn't reach the verifier right now. Please try again in a minute or contact support."] });
      } else {
        setInstapayResult({ status: "rejected", reasons: [message || "We couldn't submit your payment. Please try again."] });
      }
      setPhase("rejected");
    }
  }

  async function handleKashierCheckout() {
    if (!authToken) { setError("Please sign in before starting checkout."); return; }
    if (!query.courseId) { setError("A courseId query parameter is required."); return; }
    setCheckoutLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE}/user/payments/checkout-session`,
        { courseId: query.courseId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      window.location.assign(response.data.sessionUrl);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to create the checkout session.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function resetToForm() {
    setPhase("form");
    setInstapayResult(null);
    setScreenshotFile(null);
    setScreenshotPreview("");
    setError("");
  }

  return (
    <StudentLayout activeLink="Payment">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <button
          type="button"
          onClick={() => {
            if (phase === "form") navigate(query.courseId ? `/courses/${query.courseId}` : "/courses");
            else resetToForm();
          }}
          className="text-sm text-gray-500 hover:text-brandRed transition mb-3 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {phase === "form" ? "Back to course" : "Back to form"}
        </button>

        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-charcoal heading-font tracking-tight">Checkout</h1>
            <p className="text-gray-500 mt-1">Complete your enrollment securely.</p>
          </div>
        </div>

        {phase === "verified" ? (
          <SuccessCard
            course={course}
            countdown={countdown}
            onGoHome={() => navigate("/home", { replace: true })}
            onGoCourse={() => navigate(`/learn/${query.courseId}`, { replace: true })}
          />
        ) : phase === "pending" ? (
          <PendingCard course={course} onGoHistory={() => navigate("/payment-history")} onGoHome={() => navigate("/home")} />
        ) : phase === "rejected" ? (
          <RejectedCard reasons={instapayResult?.reasons} onRetry={resetToForm} onGoCourses={() => navigate("/courses")} />
        ) : phase === "submitting" ? (
          <SubmittingCard />
        ) : (
          <FormBlock
            course={course}
            courseLoading={courseLoading}
            error={error}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            instapayConfig={instapayConfig}
            handleScreenshotSelected={handleScreenshotSelected}
            screenshotPreview={screenshotPreview}
            screenshotFile={screenshotFile}
            handleInstapaySubmit={handleInstapaySubmit}
            handleKashierCheckout={handleKashierCheckout}
            checkoutLoading={checkoutLoading}
          />
        )}
      </div>
    </StudentLayout>
  );
}

function SuccessCard({ course, countdown, onGoHome, onGoCourse }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-8 py-12 text-center text-white">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold heading-font">You're enrolled!</h2>
        <p className="text-emerald-50 mt-2 text-lg">
          Payment for <strong className="font-bold">{course?.courseName || "your course"}</strong> was verified.
        </p>
      </div>
      <div className="p-8">
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
          <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-emerald-800 leading-relaxed">
            A confirmation email with your invoice has been sent to your inbox. Keep it as proof of purchase.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onGoCourse} className="flex-1 bg-charcoal hover:bg-brandRed text-white font-bold py-3.5 px-6 rounded-xl transition inline-flex items-center justify-center gap-2">
            Start learning
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={onGoHome} className="flex-1 bg-softGrey hover:bg-gray-200 text-charcoal font-bold py-3.5 px-6 rounded-xl transition">
            Go to dashboard {countdown > 0 ? `(${countdown})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingCard({ course, onGoHistory, onGoHome }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-8 py-12 text-center text-white">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-11 h-11" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold heading-font">Payment received</h2>
        <p className="text-blue-50 mt-2 text-lg">
          We got your submission for <strong className="font-bold">{course?.courseName || "your course"}</strong>.
        </p>
      </div>
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
          <p className="text-sm text-blue-800 leading-relaxed">
            Our team is confirming the transaction manually. You'll receive an email as soon as your enrollment is approved — this usually takes just a few minutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onGoHistory} className="flex-1 bg-charcoal hover:bg-brandRed text-white font-bold py-3.5 px-6 rounded-xl transition">
            View my payments
          </button>
          <button onClick={onGoHome} className="flex-1 bg-softGrey hover:bg-gray-200 text-charcoal font-bold py-3.5 px-6 rounded-xl transition">
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectedCard({ reasons, onRetry, onGoCourses }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-red-500 to-red-600 px-8 py-12 text-center text-white">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold heading-font">We couldn't verify this payment</h2>
        <p className="text-red-50 mt-2 text-lg">Please review the reason(s) below and try again.</p>
      </div>
      <div className="p-8">
        {Array.isArray(reasons) && reasons.length > 0 ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-6">
            <p className="text-xs font-bold tracking-widest text-red-700 uppercase mb-2">Why it failed</p>
            <ul className="space-y-2 text-sm text-red-800">
              {reasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span className="leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onRetry} className="flex-1 bg-charcoal hover:bg-brandRed text-white font-bold py-3.5 px-6 rounded-xl transition">
            Try again
          </button>
          <button onClick={onGoCourses} className="flex-1 bg-softGrey hover:bg-gray-200 text-charcoal font-bold py-3.5 px-6 rounded-xl transition">
            Back to courses
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmittingCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-brandRed animate-spin mx-auto mb-6" />
      <h2 className="text-xl font-bold text-charcoal">Verifying your payment…</h2>
      <p className="text-sm text-gray-500 mt-2">Please stay on this page. This usually takes 3-10 seconds.</p>
    </div>
  );
}

function FormBlock({
  course, courseLoading, error, activeTab, setActiveTab, instapayConfig,
  handleScreenshotSelected, screenshotPreview, screenshotFile,
  handleInstapaySubmit, handleKashierCheckout, checkoutLoading,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("instapay")}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition ${
              activeTab === "instapay" ? "bg-charcoal text-white" : "text-charcoal hover:bg-softGrey"
            }`}
          >InstaPay</button>
          <button
            type="button"
            onClick={() => setActiveTab("card")}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition ${
              activeTab === "card" ? "bg-charcoal text-white" : "text-charcoal hover:bg-softGrey"
            }`}
          >Card</button>
        </div>

        <div className="p-6">
          {courseLoading ? (
            <p className="text-gray-500 text-sm">Loading course details…</p>
          ) : course ? (
            <>
              <div className="border border-gray-100 rounded-xl p-4 mb-5 bg-softGrey/40">
                <p className="text-charcoal font-bold text-lg">{course.courseName}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {course.courseDescription || "Secure checkout for course enrollment."}
                </p>
              </div>

              {activeTab === "instapay" ? (
                <InstapayForm
                  course={course}
                  instapayConfig={instapayConfig}
                  handleScreenshotSelected={handleScreenshotSelected}
                  screenshotPreview={screenshotPreview}
                />
              ) : (
                <CardForm />
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">No course is available for checkout.</p>
          )}

          {error ? (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">Order summary</p>

        <div className="flex justify-between mb-3">
          <span className="text-sm text-gray-500">Course</span>
          <span className="text-sm font-semibold text-charcoal truncate max-w-[180px]">{course?.courseName || "-"}</span>
        </div>
        <div className="flex justify-between mb-3">
          <span className="text-sm text-gray-500">Method</span>
          <span className="text-sm font-semibold text-charcoal">{activeTab === "card" ? "Card" : "InstaPay"}</span>
        </div>
        <div className="border-t border-gray-100 my-4" />
        <div className="flex justify-between items-baseline mb-5">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-2xl font-extrabold text-charcoal">{formatCurrency(course?.coursePrice)}</span>
        </div>

        {activeTab === "card" ? (
          <button
            type="button"
            disabled={!course || checkoutLoading}
            onClick={handleKashierCheckout}
            className="w-full bg-charcoal hover:bg-brandRed disabled:opacity-60 disabled:hover:bg-charcoal text-white font-bold py-3.5 px-4 rounded-xl transition"
          >
            {checkoutLoading ? "Preparing checkout…" : "Pay by card"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!screenshotFile}
            onClick={handleInstapaySubmit}
            className="w-full bg-charcoal hover:bg-brandRed disabled:opacity-60 disabled:hover:bg-charcoal text-white font-bold py-3.5 px-4 rounded-xl transition"
          >
            Verify &amp; Enroll
          </button>
        )}

        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          {activeTab === "card"
            ? "Card details are entered on the secure gateway page. We only see the confirmation."
            : "Send the amount via InstaPay, then upload the confirmation screenshot. Verification is automatic."}
        </p>
      </div>
    </div>
  );
}

function InstapayForm({ course, instapayConfig, handleScreenshotSelected, screenshotPreview }) {
  return (
    <>
      <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 mb-5">
        <p className="text-[10px] font-bold tracking-widest uppercase text-white/70">Step 1</p>
        <p className="text-white font-bold text-lg mt-1">Send the payment via your bank app</p>
        <p className="text-sm text-white/80 mt-2">
          Send <span className="font-bold text-white">{formatCurrency(course?.coursePrice)}</span> via InstaPay to:
        </p>
        <div className="bg-white/15 rounded-xl mt-3 px-5 py-4 text-center font-mono font-bold text-2xl tracking-wide">
          {instapayConfig?.handle || "loading…"}
        </div>
        <p className="text-xs text-white/70 mt-3">After sending, take a screenshot of the confirmation.</p>
      </div>

      <div className="rounded-xl border border-gray-200 p-5">
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Step 2 — Upload confirmation screenshot</p>
        <label className="block cursor-pointer">
          <input accept="image/*" onChange={handleScreenshotSelected} type="file" className="hidden" />
          <div className={`border-2 border-dashed rounded-xl px-6 py-8 text-center transition ${screenshotPreview ? "border-emerald-300 bg-emerald-50" : "border-gray-300 hover:border-brandRed hover:bg-red-50/30"}`}>
            {screenshotPreview ? (
              <div>
                <img src={screenshotPreview} alt="Preview" className="max-h-60 mx-auto rounded-lg border border-emerald-200" />
                <p className="text-xs text-emerald-700 mt-3 font-semibold">Screenshot ready. Click Verify &amp; Enroll when done.</p>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-charcoal font-semibold mt-3">Click to upload screenshot</p>
                <p className="text-xs text-gray-400 mt-1">PNG or JPG, up to 6 MB</p>
              </>
            )}
          </div>
        </label>
      </div>
    </>
  );
}

function CardForm() {
  return (
    <div className="rounded-xl bg-charcoal text-white p-6">
      <p className="text-[10px] font-bold tracking-widest uppercase text-white/60">Card payment</p>
      <p className="text-white font-bold text-xl mt-1">Visa / MasterCard via Kashier</p>
      <p className="text-sm text-white/70 mt-2 leading-relaxed">
        You'll be redirected to Kashier's secure page to enter your card details. We never see the card number.
      </p>
    </div>
  );
}
