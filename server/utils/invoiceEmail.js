const sendEmail = require("./sendEmail");

function formatMoney(amount, currency) {
  const num = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EGP",
      maximumFractionDigits: 2,
    }).format(num);
  } catch (error) {
    return `${num.toFixed(2)} ${currency || "EGP"}`;
  }
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(d.getTime())) {
    return String(date || "");
  }

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderInvoiceHtml({ studentName, courseName, amount, currency, referenceNumber, instapayReference, paidAt, method }) {
  const brand = process.env.MAIL_FROM || "Sono School";

  return `<!doctype html>
<html>
<body style="font-family: Arial, sans-serif; background: #f5f7fb; padding: 24px; color: #111827;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);">
    <div style="background: linear-gradient(135deg, #111827 0%, #4f46e5 100%); color: #ffffff; padding: 28px;">
      <div style="font-size: 13px; letter-spacing: 1.4px; text-transform: uppercase; opacity: 0.75;">${brand}</div>
      <div style="font-size: 26px; font-weight: 800; margin-top: 6px;">Thank you for your purchase</div>
      <div style="opacity: 0.85; margin-top: 6px;">Your enrollment is confirmed. This email is your invoice.</div>
    </div>

    <div style="padding: 24px 28px;">
      <p style="font-size: 15px; margin-top: 0;">Hi <strong>${studentName || "there"}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        We received your payment for <strong>${courseName || "your course"}</strong>. You can start learning right away
        from your dashboard.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Course</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600;">${courseName || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Amount paid</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 700;">${formatMoney(amount, currency)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Payment method</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600;">${method || "InstaPay"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Invoice reference</td>
          <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 12px;">${referenceNumber || "-"}</td>
        </tr>
        ${
          instapayReference
            ? `<tr>
                <td style="padding: 10px 0; color: #6b7280;">InstaPay reference</td>
                <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 12px;">${instapayReference}</td>
              </tr>`
            : ""
        }
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Paid on</td>
          <td style="padding: 10px 0; text-align: right;">${formatDate(paidAt || Date.now())}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #6b7280; margin-top: 22px; line-height: 1.6;">
        Keep this email as proof of purchase. If you need help, reply to this message and our team will get back to you.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 16px 28px; font-size: 12px; color: #6b7280; text-align: center;">
      &copy; ${new Date().getFullYear()} ${brand}. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

async function sendInvoiceEmail({
  to,
  studentName,
  courseName,
  amount,
  currency,
  referenceNumber,
  instapayReference,
  paidAt,
  method,
}) {
  if (!to) {
    return { skipped: true, reason: "no recipient email" };
  }

  const html = renderInvoiceHtml({
    studentName,
    courseName,
    amount,
    currency,
    referenceNumber,
    instapayReference,
    paidAt,
    method,
  });

  return sendEmail({
    to,
    subject: `Your invoice for ${courseName || "your course"} — thank you for your purchase`,
    html,
  });
}

module.exports = { sendInvoiceEmail };
