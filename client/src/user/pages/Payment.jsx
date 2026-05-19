import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const cardStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 12px 30px rgba(17, 24, 39, 0.08)",
};

const mutedTextStyle = {
  color: "#6b7280",
  fontSize: 14,
};

function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const candidates = ["token", "userToken", "adminToken"];

  for (const key of candidates) {
    const localValue = window.localStorage?.getItem(key);
    if (localValue) {
      return localValue;
    }

    const sessionValue = window.sessionStorage?.getItem(key);
    if (sessionValue) {
      return sessionValue;
    }
  }

  return "";
}

function getQueryParams() {
  if (typeof window === "undefined") {
    return {
      courseId: "",
      paymentRef: "",
    };
  }

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

function mapStatusTone(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "confirmed") {
    return { background: "#ecfdf3", color: "#027a48", label: "Confirmed" };
  }

  if (normalizedStatus === "failed" || normalizedStatus === "expired") {
    return { background: "#fef3f2", color: "#b42318", label: normalizedStatus };
  }

  if (normalizedStatus === "refunded") {
    return { background: "#fff7ed", color: "#c2410c", label: "Refunded" };
  }

  return { background: "#eff6ff", color: "#1d4ed8", label: "Pending" };
}

export default function PaymentPage() {
  const query = useMemo(() => getQueryParams(), []);
  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentState, setPaymentState] = useState(null);

  const authToken = useMemo(() => getStoredAuthToken(), []);

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
        const response = await axios.get(`/api/user/courses/${query.courseId}`);

        if (!ignore) {
          setCourse(response.data);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(
            requestError.response?.data?.message ||
              "Failed to load the selected course."
          );
        }
      } finally {
        if (!ignore) {
          setCourseLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      ignore = true;
    };
  }, [query.courseId]);

  useEffect(() => {
    if (!query.paymentRef || !authToken) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId = null;

    async function loadPaymentStatus() {
      setStatusLoading(true);

      try {
        const response = await axios.get(
          `/api/user/payments/${query.paymentRef}/status`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (cancelled) {
          return;
        }

        setPaymentState(response.data);

        if (String(response.data?.status || "").toLowerCase() === "pending") {
          timeoutId = window.setTimeout(loadPaymentStatus, 5000);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Failed to verify the payment status."
          );
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    }

    loadPaymentStatus();

    return () => {
      cancelled = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [authToken, query.paymentRef]);

  async function handleCheckout() {
    if (!authToken) {
      setError("Please sign in before starting checkout.");
      return;
    }

    if (!query.courseId) {
      setError("A courseId query parameter is required to create a payment session.");
      return;
    }

    setCheckoutLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "/api/user/payments/checkout-session",
        {
          courseId: query.courseId,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      window.location.assign(response.data.sessionUrl);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Failed to create the hosted checkout session."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  const statusTone = mapStatusTone(paymentState?.status);
  const canStartCheckout =
    !!course &&
    !checkoutLoading &&
    !statusLoading &&
    String(paymentState?.status || "").toLowerCase() !== "confirmed";

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2ff 48%, #f8fafc 100%)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <div style={{ color: "#111827", fontSize: 28, fontWeight: 800 }}>
              SonoSchool Checkout
            </div>
            <div style={mutedTextStyle}>
              Kashier hosted payment with server-side verification only.
            </div>
          </div>

          {paymentState ? (
            <div
              style={{
                background: statusTone.background,
                borderRadius: 999,
                color: statusTone.color,
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 14px",
                textTransform: "capitalize",
              }}
            >
              Payment {statusTone.label}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0, 1.45fr) minmax(280px, 0.85fr)",
          }}
        >
          <div style={cardStyle}>
            <h3 style={{ color: "#111827", fontSize: 22, marginTop: 0 }}>
              Course Checkout
            </h3>

            {courseLoading ? (
              <p style={mutedTextStyle}>Loading course details...</p>
            ) : course ? (
              <>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    marginBottom: 18,
                    padding: 18,
                  }}
                >
                  <div style={{ color: "#111827", fontSize: 20, fontWeight: 700 }}>
                    {course.courseName}
                  </div>
                  <p style={{ ...mutedTextStyle, lineHeight: 1.6, marginBottom: 0 }}>
                    {course.courseDescription || "Hosted checkout for secure course enrollment."}
                  </p>
                </div>

                <div
                  style={{
                    background: "#111827",
                    borderRadius: 14,
                    color: "#fff",
                    marginBottom: 18,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      letterSpacing: 1.1,
                      opacity: 0.7,
                      textTransform: "uppercase",
                    }}
                  >
                    Payment Method
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
                    Visa / MasterCard via Kashier
                  </div>
                  <div style={{ marginTop: 10, opacity: 0.78 }}>
                    Card details are entered only on Kashier’s hosted page.
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 18,
                  }}
                >
                  <div style={{ color: "#111827", fontWeight: 700, marginBottom: 10 }}>
                    Security protections
                  </div>
                  <div style={mutedTextStyle}>
                    Amount comes from the backend course record.
                  </div>
                  <div style={mutedTextStyle}>
                    Payment success is verified server-side before enrollment.
                  </div>
                  <div style={mutedTextStyle}>
                    Webhook retries and duplicate clicks are handled idempotently.
                  </div>
                </div>
              </>
            ) : (
              <p style={mutedTextStyle}>No course is available for checkout.</p>
            )}

            {error ? (
              <div
                style={{
                  background: "#fef3f2",
                  border: "1px solid #fecaca",
                  borderRadius: 12,
                  color: "#b42318",
                  marginTop: 18,
                  padding: 14,
                }}
              >
                {error}
              </div>
            ) : null}
          </div>

          <div style={cardStyle}>
            <h3 style={{ color: "#111827", fontSize: 20, marginTop: 0 }}>
              Order Summary
            </h3>

            <div
              style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}
            >
              <span style={mutedTextStyle}>Course</span>
              <span style={{ color: "#111827", fontWeight: 600 }}>
                {course?.courseName || "-"}
              </span>
            </div>

            <div
              style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}
            >
              <span style={mutedTextStyle}>Price</span>
              <span style={{ color: "#111827", fontWeight: 700 }}>
                {formatCurrency(course?.coursePrice)}
              </span>
            </div>

            <div
              style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}
            >
              <span style={mutedTextStyle}>Gateway</span>
              <span style={{ color: "#111827", fontWeight: 600 }}>
                Kashier Hosted Session
              </span>
            </div>

            {paymentState?.referenceNumber ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...mutedTextStyle, marginBottom: 4 }}>
                  Payment Reference
                </div>
                <div
                  style={{ color: "#111827", fontFamily: "monospace", fontSize: 13 }}
                >
                  {paymentState.referenceNumber}
                </div>
              </div>
            ) : query.paymentRef ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...mutedTextStyle, marginBottom: 4 }}>
                  Payment Reference
                </div>
                <div
                  style={{ color: "#111827", fontFamily: "monospace", fontSize: 13 }}
                >
                  {query.paymentRef}
                </div>
              </div>
            ) : null}

            <button
              disabled={!canStartCheckout}
              onClick={handleCheckout}
              style={{
                background: canStartCheckout ? "#111827" : "#9ca3af",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                cursor: canStartCheckout ? "pointer" : "not-allowed",
                fontSize: 16,
                fontWeight: 700,
                marginTop: 10,
                padding: "14px 18px",
                width: "100%",
              }}
            >
              {checkoutLoading
                ? "Creating secure checkout..."
                : paymentState?.status === "confirmed"
                ? "Payment already confirmed"
                : "Pay Securely with Kashier"}
            </button>

            {statusLoading ? (
              <p style={{ ...mutedTextStyle, marginTop: 12 }}>
                Verifying payment status with the backend...
              </p>
            ) : null}

            <p style={{ ...mutedTextStyle, lineHeight: 1.7, marginTop: 16 }}>
              The backend creates the payment session, validates the amount from the
              course record, verifies Kashier results server-side, and only then
              finalizes enrollment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}