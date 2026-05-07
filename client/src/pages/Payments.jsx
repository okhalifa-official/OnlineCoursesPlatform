import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createPayment,
  deletePayment,
  getPaymentStats,
  getPayments,
  refundPayment,
  seedPayments,
  sendPaymentReminder,
  updatePaymentStatus,
} from "../api/paymentsApi";

const emptyPayment = {
  userName: "",
  userEmail: "",
  courseName: "",
  department: "",
  amount: "",
  currency: "USD",
  method: "Visa",
  status: "pending",
  gateway: "Manual",
  riskLevel: "Low",
  riskScore: 8,
  subtotal: "",
  processingFee: "",
  tax: "",
  notes: "",
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState(emptyPayment);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    method: "all",
    date: "",
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  async function loadPayments() {
    try {
      setLoading(true);

      const [paymentsData, statsData] = await Promise.all([
        getPayments(filters),
        getPaymentStats(),
      ]);

      setPayments(paymentsData.payments || []);
      setStats(statsData);

      setPagination({
        total: paymentsData.total || 0,
        totalPages: paymentsData.totalPages || 1,
      });
    } catch (error) {
      alert(error.message);
      console.error("Load payments error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(
    function () {
      const timer = setTimeout(function () {
        loadPayments();
      }, 300);

      return function () {
        clearTimeout(timer);
      };
    },
    [
      filters.search,
      filters.status,
      filters.method,
      filters.date,
      filters.page,
    ],
  );

  function handleFilterChange(e) {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  }

  function setQuickStatusFilter(status) {
    setFilters((prev) => ({
      ...prev,
      status,
      page: 1,
    }));
  }

  function goToPage(page) {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  }

  function handleFormChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCreatePayment(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await createPayment({
        ...formData,
        amount: Number(formData.amount || 0),
        subtotal: Number(formData.subtotal || formData.amount || 0),
        processingFee: Number(formData.processingFee || 0),
        tax: Number(formData.tax || 0),
        riskScore: Number(formData.riskScore || 0),
      });

      setIsCreateOpen(false);
      setFormData(emptyPayment);
      await loadPayments();
    } catch (error) {
      alert(error.message);
      console.error("Create payment error:", error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(payment, status) {
    try {
      await updatePaymentStatus(payment._id, status);
      setSelectedPayment(null);
      await loadPayments();
    } catch (error) {
      alert(error.message);
      console.error("Update payment status error:", error.message);
    }
  }

  async function handleRefund(payment) {
    const confirmed = window.confirm(
      `Are you sure you want to refund ${payment.transactionId}?`,
    );

    if (!confirmed) return;

    try {
      await refundPayment(payment._id);
      setSelectedPayment(null);
      await loadPayments();
    } catch (error) {
      alert(error.message);
      console.error("Refund payment error:", error.message);
    }
  }

  async function handleReminder(payment) {
    try {
      await sendPaymentReminder(payment._id);
      alert("Payment reminder sent successfully");
      setSelectedPayment(null);
      await loadPayments();
    } catch (error) {
      alert(error.message);
      console.error("Send reminder error:", error.message);
    }
  }

  async function handleDelete(payment) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${payment.transactionId}?`,
    );

    if (!confirmed) return;

    try {
      await deletePayment(payment._id);
      await loadPayments();
    } catch (error) {
      alert(error.message);
      console.error("Delete payment error:", error.message);
    }
  }

  async function handleSeedPayments() {
    try {
      await seedPayments();
      await loadPayments();
    } catch (error) {
      alert(error.message);
      console.error("Seed payments error:", error.message);
    }
  }

  function exportCsv() {
    const rows = payments.map((payment) => ({
      transactionId: payment.transactionId,
      userName: payment.userName,
      userEmail: payment.userEmail,
      courseName: payment.courseName,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      date: formatDate(payment.paymentDate),
    }));

    const csv = [
      Object.keys(
        rows[0] || {
          transactionId: "",
          userName: "",
          userEmail: "",
          courseName: "",
          amount: "",
          currency: "",
          method: "",
          status: "",
          date: "",
        },
      ).join(","),
      ...rows.map((row) =>
        Object.values(row)
          .map((value) => `"${String(value || "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "payments-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-softGrey text-charcoal p-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-5 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-charcoal heading-font">
            Payments
          </h1>

          <p className="text-[#333333] mt-1">
            Monitor and manage institutional revenue streams.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 bg-charcoal text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-brandRed transition-all"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Dashboard
          </Link>

          <Link
            to="/payments/settings"
            className="flex items-center gap-2 bg-white text-charcoal border border-[#DDDDDD] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#fafafa] transition-all"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-brandRed text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Payment
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 bg-white text-brandRed border border-[#DDDDDD] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#fafafa] transition-all"
          >
            <span className="material-symbols-outlined text-lg">ios_share</span>
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleSeedPayments}
            className="flex items-center gap-2 bg-white text-charcoal border border-[#DDDDDD] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#fafafa] transition-all"
          >
            <span className="material-symbols-outlined text-lg">database</span>
            Seed Data
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <MetricCard
          label="Total Revenue"
          value={`${formatMoney(stats?.totalRevenue || 0)}`}
          badge="+12%"
          red
          onClick={() => setQuickStatusFilter("all")}
        />

        <MetricCard
          label="Successful Payments"
          value={stats?.successfulPayments || 0}
          icon="check_circle"
          success
          onClick={() => setQuickStatusFilter("success")}
        />

        <MetricCard
          label="Failed Payments"
          value={stats?.failedPayments || 0}
          icon="cancel"
          danger
          onClick={() => setQuickStatusFilter("failed")}
        />

        <MetricCard
          label="Pending"
          value={stats?.pendingPayments || 0}
          icon="pending"
          warning
          onClick={() => setQuickStatusFilter("pending")}
        />
      </section>

      <section className="bg-white rounded-xl shadow-card border border-[#E5E5E5] overflow-hidden mb-12">
        <div className="p-6 border-b border-[#EEEEEE] flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-[#FAFAFA]">
          <h3 className="text-lg font-bold text-charcoal heading-font">
            Recent Transactions
          </h3>

          <div className="flex gap-3 flex-wrap">
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search transactions..."
              className="h-10 rounded-xl border border-[#DDDDDD] bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
            />

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="h-10 rounded-xl border border-[#DDDDDD] bg-white px-4 text-sm outline-none"
            >
              <option value="all">All Status</option>
              <option value="success">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              name="method"
              value={filters.method}
              onChange={handleFilterChange}
              className="h-10 rounded-xl border border-[#DDDDDD] bg-white px-4 text-sm outline-none"
            >
              <option value="all">All Methods</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Paypal">Paypal</option>
              <option value="Digital Wallet">Digital Wallet</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>

            <select
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="h-10 rounded-xl border border-[#DDDDDD] bg-white px-4 text-sm outline-none"
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-[#FAFAFA]">
                <Th>User</Th>
                <Th>Course Name</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th right>Actions</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EEEEEE]">
              {loading && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
                    Loading payments...
                  </td>
                </tr>
              )}

              {!loading &&
                payments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-[#FCFCFC] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-softGrey flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">
                            person
                          </span>
                        </div>

                        <div>
                          <span className="text-sm font-semibold text-charcoal block">
                            {payment.userName}
                          </span>
                          <span className="text-xs text-[#666]">
                            {payment.userEmail || "-"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-[#333333] font-medium">
                      {payment.courseName}
                    </td>

                    <td className="px-6 py-4 text-sm font-bold text-charcoal">
                      {payment.currency}{" "}
                      {Number(payment.amount || 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[#333333]">
                        <span className="material-symbols-outlined text-lg">
                          {getMethodIcon(payment.method)}
                        </span>
                        <span className="text-xs font-medium uppercase">
                          {payment.method}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} />
                    </td>

                    <td className="px-6 py-4 text-sm text-[#333333]">
                      {formatDate(payment.paymentDate)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(payment)}
                          className="text-brandRed hover:text-[#b92323] text-sm font-bold"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(payment)}
                          className="text-red-700 hover:text-red-900 text-sm font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-xl font-bold heading-font text-charcoal mb-2">
                      No transactions found
                    </p>

                    <p className="text-sm text-[#333333]">
                      Change the search or filter and try again.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-[#EEEEEE] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-sm">
          <span className="text-[#333333] font-medium">
            Showing {payments.length} of {pagination.total} entries
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => goToPage(filters.page - 1)}
              className="p-2 border border-[#DDDDDD] rounded-lg text-[#333333] disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">
                chevron_left
              </span>
            </button>

            <button className="w-8 h-8 flex items-center justify-center bg-brandRed text-white rounded-lg font-bold">
              {filters.page}
            </button>

            <button
              type="button"
              disabled={filters.page >= pagination.totalPages}
              onClick={() => goToPage(filters.page + 1)}
              className="p-2 border border-[#DDDDDD] rounded-lg text-[#333333] disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#7d1717] to-brandRed p-8 rounded-xl text-white shadow-card relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-2xl font-black mb-2 heading-font">
              Quarterly Revenue Growth
            </h4>

            <p className="text-white/80 mb-6 max-w-md">
              Institutional performance is tracked through completed payment
              transactions and pending payment reviews.
            </p>

            <div className="flex gap-12 flex-wrap">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  Current Revenue
                </p>

                <p className="text-3xl font-extrabold heading-font">
                  {formatMoney(stats?.totalRevenue || 0)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  Pending Payments
                </p>

                <p className="text-3xl font-extrabold heading-font">
                  {stats?.pendingPayments || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10">
            <span className="material-symbols-outlined text-[12rem]">
              trending_up
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-6 rounded-xl shadow-card flex flex-col justify-center">
          <h4 className="text-charcoal font-bold mb-4 heading-font">
            Payment Methods Mix
          </h4>

          <div className="space-y-4">
            {(stats?.methods || []).length === 0 && (
              <p className="text-sm text-[#333333]">No method data yet.</p>
            )}

            {(stats?.methods || []).map((item) => (
              <div
                className="flex items-center justify-between"
                key={item.method}
              >
                <span className="text-xs font-bold text-[#333333]">
                  {item.method}
                </span>

                <div className="flex-1 mx-4 h-1.5 bg-[#E9E9E9] rounded-full overflow-hidden">
                  <div
                    className="bg-brandRed h-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>

                <span className="text-xs font-black text-charcoal">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onMarkComplete={() => handleStatusUpdate(selectedPayment, "success")}
          onReminder={() => handleReminder(selectedPayment)}
          onRefund={() => handleRefund(selectedPayment)}
        />
      )}

      {isCreateOpen && (
        <CreatePaymentModal
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleCreatePayment}
          onClose={() => setIsCreateOpen(false)}
          saving={saving}
        />
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  badge,
  icon,
  red,
  success,
  danger,
  warning,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-card border border-[#E5E5E5] text-left"
    >
      <p className="text-[#333333] text-xs font-bold uppercase tracking-wider mb-2">
        {label}
      </p>

      <div className="flex items-center justify-between">
        <span
          className={`text-3xl font-extrabold tracking-tighter heading-font ${
            red ? "text-brandRed" : "text-charcoal"
          }`}
        >
          {value}
        </span>

        {badge && (
          <span className="text-[#0A5E35] text-xs font-bold bg-[#EAF7EF] px-2 py-1 rounded-full">
            {badge}
          </span>
        )}

        {icon && (
          <span
            className={`material-symbols-outlined ${
              success
                ? "text-[#0A5E35]"
                : danger
                  ? "text-[#BA1A1A]"
                  : warning
                    ? "text-[#B98D36]"
                    : "text-brandRed"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
    </button>
  );
}

function Th({ children, right }) {
  return (
    <th
      className={`px-6 py-4 text-xs font-bold text-[#333333] uppercase tracking-widest ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function StatusBadge({ status }) {
  const styles = {
    success: "bg-[#EAF7EF] text-[#0A5E35]",
    pending: "bg-[#FFF4E0] text-[#B98D36]",
    failed: "bg-[#FFE7E7] text-[#BA1A1A]",
    refunded: "bg-softGrey text-charcoal",
  };

  return (
    <span
      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tight ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}

function PaymentDetailsModal({
  payment,
  onClose,
  onMarkComplete,
  onReminder,
  onRefund,
}) {
  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      <div className="relative z-10 min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-card border border-[#DDDDDD] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#DDDDDD] flex items-center justify-between bg-[#fafafa]">
            <div>
              <h3 className="text-xl font-bold heading-font text-charcoal">
                Transaction Details
              </h3>

              <p className="text-sm text-[#333333]">{payment.transactionId}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-softGrey transition"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Detail label="User" value={payment.userName} />
            <Detail label="Email" value={payment.userEmail} />
            <Detail label="Course" value={payment.courseName} />
            <Detail label="Department" value={payment.department} />
            <Detail
              label="Amount"
              value={`${payment.currency} ${Number(payment.amount || 0).toFixed(
                2,
              )}`}
            />
            <Detail label="Method" value={payment.method} />
            <Detail label="Status" value={payment.status} />
            <Detail label="Gateway" value={payment.gateway} />
            <Detail label="Risk Level" value={payment.riskLevel} />
            <Detail label="Risk Score" value={`${payment.riskScore || 0}%`} />
            <Detail label="Date" value={formatDate(payment.paymentDate)} />
            <Detail label="Notes" value={payment.notes} />
          </div>

          <div className="px-6 py-5 border-t border-[#DDDDDD] flex flex-wrap gap-3 justify-end bg-[#fafafa]">
            <button
              type="button"
              onClick={onMarkComplete}
              className="px-5 py-2.5 rounded-xl bg-[#0A5E35] text-white font-semibold hover:opacity-95 transition"
            >
              Mark Complete
            </button>

            <button
              type="button"
              onClick={onReminder}
              className="px-5 py-2.5 rounded-xl bg-[#B98D36] text-white font-semibold hover:opacity-95 transition"
            >
              Send Reminder
            </button>

            <button
              type="button"
              onClick={onRefund}
              className="px-5 py-2.5 rounded-xl bg-brandRed text-white font-semibold hover:opacity-95 transition"
            >
              Refund
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePaymentModal({ formData, onChange, onSubmit, onClose, saving }) {
  return (
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-card border border-[#DDDDDD] overflow-hidden flex flex-col"
        >
          <div className="px-6 py-5 border-b border-[#DDDDDD] flex items-center justify-between bg-[#fafafa] shrink-0">
            <div>
              <h3 className="text-xl font-bold heading-font text-charcoal">
                Add Payment Transaction
              </h3>

              <p className="text-sm text-[#333333]">
                Create a manual payment record.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-softGrey transition"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="User Name"
                name="userName"
                value={formData.userName}
                onChange={onChange}
                required
              />

              <Input
                label="User Email"
                name="userEmail"
                value={formData.userEmail}
                onChange={onChange}
                type="email"
              />

              <Input
                label="Course Name"
                name="courseName"
                value={formData.courseName}
                onChange={onChange}
                required
              />

              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={onChange}
              />

              <Input
                label="Amount"
                name="amount"
                value={formData.amount}
                onChange={onChange}
                type="number"
                required
              />

              <Select
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={onChange}
                options={["USD", "EUR", "GBP", "EGP"]}
              />

              <Select
                label="Method"
                name="method"
                value={formData.method}
                onChange={onChange}
                options={[
                  "Visa",
                  "Mastercard",
                  "Paypal",
                  "Digital Wallet",
                  "Cash",
                  "Bank Transfer",
                ]}
              />

              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={onChange}
                options={["success", "pending", "failed", "refunded"]}
              />

              <Input
                label="Gateway"
                name="gateway"
                value={formData.gateway}
                onChange={onChange}
              />

              <Select
                label="Risk Level"
                name="riskLevel"
                value={formData.riskLevel}
                onChange={onChange}
                options={["Low", "Medium", "High"]}
              />

              <Input
                label="Risk Score"
                name="riskScore"
                value={formData.riskScore}
                onChange={onChange}
                type="number"
              />

              <Input
                label="Subtotal"
                name="subtotal"
                value={formData.subtotal}
                onChange={onChange}
                type="number"
              />

              <Input
                label="Processing Fee"
                name="processingFee"
                value={formData.processingFee}
                onChange={onChange}
                type="number"
              />

              <Input
                label="Tax"
                name="tax"
                value={formData.tax}
                onChange={onChange}
                type="number"
              />

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#333333] mb-2 block">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes || ""}
                  onChange={onChange}
                  rows="3"
                  className="w-full rounded-xl border border-[#DDDDDD] bg-softGrey px-4 py-3 outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-t border-[#DDDDDD] flex justify-end gap-3 bg-[#fafafa] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#DDDDDD] font-semibold hover:bg-softGrey transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brandRed text-white font-semibold hover:opacity-95 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-[#333333] mb-2 block">
        {label}
      </label>

      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        type={type}
        required={required}
        className="w-full rounded-xl border border-[#DDDDDD] bg-softGrey px-4 py-3 outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-[#333333] mb-2 block">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-[#DDDDDD] bg-softGrey px-4 py-3 outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-softGrey p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </p>

      <p className="font-semibold text-charcoal">{value || "-"}</p>
    </div>
  );
}

function getMethodIcon(method) {
  if (method === "Digital Wallet" || method === "Paypal") {
    return "account_balance_wallet";
  }

  if (method === "Cash") {
    return "payments";
  }

  if (method === "Bank Transfer") {
    return "account_balance";
  }

  return "credit_card";
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString();
}
