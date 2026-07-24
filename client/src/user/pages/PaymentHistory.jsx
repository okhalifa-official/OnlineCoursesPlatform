import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import StudentLayout from "../components/StudentLayout";
import { formatPrice } from "../../utils/currency";

const API_BASE = "http://localhost:4000/api";

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

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_META = {
  auto_approved: { label: "Approved",     tone: "green",  icon: "check_circle" },
  approved:      { label: "Approved",     tone: "green",  icon: "check_circle" },
  confirmed:     { label: "Confirmed",    tone: "green",  icon: "check_circle" },
  under_review:  { label: "Under review", tone: "blue",   icon: "schedule"     },
  pending:       { label: "Pending",      tone: "blue",   icon: "schedule"     },
  rejected:      { label: "Rejected",     tone: "red",    icon: "block"        },
  failed:        { label: "Failed",       tone: "red",    icon: "block"        },
  refunded:      { label: "Refunded",     tone: "amber",  icon: "undo"         },
  expired:       { label: "Expired",      tone: "gray",   icon: "history"      },
};

const TONE_CLASSES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue:  "bg-blue-50 text-blue-700 border-blue-200",
  red:   "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  gray:  "bg-gray-100 text-gray-600 border-gray-200",
};

const TONE_ICON = {
  green: "text-emerald-500",
  blue:  "text-blue-500",
  red:   "text-red-500",
  amber: "text-amber-500",
  gray:  "text-gray-400",
};

export default function PaymentHistory() {
  const navigate = useNavigate();
  const authToken = useMemo(() => getStoredAuthToken(), []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!authToken) {
        setError("Please sign in to see your payments.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_BASE}/user/payments/history`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!ignore) setItems(response.data?.items || []);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || "Failed to load your payments.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [authToken]);

  const stats = useMemo(() => {
    let total = 0, pending = 0, approved = 0;
    const spentByCurrency = {};
    items.forEach((p) => {
      total += 1;
      const s = p.displayStatus;
      if (s === "under_review" || s === "pending") pending += 1;
      if (s === "auto_approved" || s === "approved" || s === "confirmed") {
        approved += 1;
        const currency = p.currency || "EGP";
        spentByCurrency[currency] = (spentByCurrency[currency] || 0) + Number(p.amount || 0);
      }
    });
    return { total, spentByCurrency, pending, approved };
  }, [items]);

  return (
    <StudentLayout activeLink="Payment">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-charcoal heading-font tracking-tight">Payments</h1>
            <p className="text-gray-500 mt-1">Your enrollments, receipts, and any submissions still being verified.</p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 bg-charcoal text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-brandRed transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Buy a course
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total payments"   value={stats.total}                            accent="text-charcoal" />
          <StatCard label="Approved"         value={stats.approved}                          accent="text-emerald-600" />
          <StatCard label="Pending"          value={stats.pending}                           accent="text-blue-600" />
          <StatCard
            label="Total spent"
            value={Object.entries(stats.spentByCurrency)
              .map(([currency, amount]) => formatPrice(amount, currency))
              .join(" + ") || formatPrice(0, "EGP")}
            accent="text-brandRed"
          />
        </div>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-red-700 shadow-sm">
            {error}
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {items.map((payment) => (
              <PaymentRow key={payment._id} payment={payment} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
      <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{label}</p>
      <p className={`text-2xl font-extrabold mt-2 ${accent}`}>{value}</p>
    </div>
  );
}

function PaymentRow({ payment }) {
  const meta = STATUS_META[payment.displayStatus] || STATUS_META.pending;
  const toneClass = TONE_CLASSES[meta.tone];
  const iconTone = TONE_ICON[meta.tone];
  const isPending = payment.displayStatus === "under_review" || payment.displayStatus === "pending";
  const isRejected = payment.displayStatus === "rejected" || payment.displayStatus === "failed";
  const isApproved =
    payment.displayStatus === "auto_approved" ||
    payment.displayStatus === "approved" ||
    payment.displayStatus === "confirmed";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${toneClass} shrink-0`}>
            <span className={`material-symbols-outlined text-xl ${iconTone}`}>{meta.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-charcoal font-bold text-base truncate">{payment.courseName}</p>
              <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 border ${toneClass}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(payment.createdAt)}
              <span className="mx-1.5">•</span>
              {payment.gateway === "instapay" ? "InstaPay" : "Card"}
              {payment.instapayReference && (
                <>
                  <span className="mx-1.5">•</span>
                  <span className="font-mono">Ref {payment.instapayReference}</span>
                </>
              )}
            </p>

            {isPending && (
              <p className="text-sm text-blue-700 mt-2 leading-relaxed">
                Our team is confirming your payment. You'll receive an email once it's approved — usually within a few minutes.
              </p>
            )}
            {isRejected && payment.verificationReasons?.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-red-700 list-disc list-inside">
                {payment.verificationReasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
            {isRejected && (!payment.verificationReasons || payment.verificationReasons.length === 0) && payment.failureReason && (
              <p className="text-sm text-red-700 mt-2">{payment.failureReason}</p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl font-extrabold text-charcoal">
            {formatPrice(payment.amount, payment.currency)}
          </p>

          {isApproved && payment.courseId && (
            <Link
              to={`/learn/${payment.courseId}`}
              className="inline-flex items-center gap-1 text-brandRed hover:underline text-sm font-bold mt-2"
            >
              Open course
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          {isRejected && payment.courseId && (
            <Link
              to={`/payment?courseId=${payment.courseId}`}
              className="inline-flex items-center gap-1 text-brandRed hover:underline text-sm font-bold mt-2"
            >
              Try again
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
      <div className="w-16 h-16 rounded-full bg-softGrey flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm3 8h4" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-charcoal">No payments yet</h3>
      <p className="text-sm text-gray-500 mt-1.5">When you buy a course, your payments will show up here.</p>
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 bg-charcoal text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-brandRed transition mt-5"
      >
        Browse courses
      </Link>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
              <div className="h-3 w-1/3 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
