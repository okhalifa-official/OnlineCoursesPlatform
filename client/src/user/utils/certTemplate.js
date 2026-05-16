/**
 * SonoSchool Certificate of Completion — template & PDF download.
 *
 * Two export paths:
 *   openCertPrint(params)    — opens a print window (fallback / browser print)
 *   downloadCertPdf(params)  — generates a real PDF and saves it directly to
 *                              the user's Downloads folder (no dialog).
 */

// ─── shared helpers ───────────────────────────────────────────────────────────

function renewalDateStr(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + 2);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

const GRAD_CAP_SVG = `
<svg width="52" height="46" viewBox="0 0 52 46" fill="white" xmlns="http://www.w3.org/2000/svg">
  <polygon points="26,4 50,16 26,28 2,16"/>
  <path d="M13,21 L13,36 Q13,42 26,42 Q39,42 39,36 L39,21 L26,28 Z"/>
  <rect x="49" y="16" width="2.5" height="15" rx="1.25"/>
  <circle cx="50.25" cy="33.5" r="3"/>
</svg>`;

// Builds the certificate as a self-contained HTML fragment (no <html>/<body>).
// Uses only inline styles so it renders correctly both in the print window
// and when injected into a hidden DOM node for html2canvas capture.
function buildCertFragment({ studentName, courseName, date, code }) {
  const renewal = renewalDateStr(date);

  const fieldRow = (items) =>
    items
      .map(
        ([val, label]) => `
      <div style="text-align:center;min-width:0;">
        <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:3px;word-break:break-word;">${val}</div>
        <div style="height:2.5px;background:#CC0000;margin-bottom:3px;"></div>
        <div style="font-size:10.5px;color:#CC0000;font-weight:700;line-height:1.2;">${label}</div>
      </div>`
      )
      .join("");

  return `
<div style="width:1060px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 6px 40px rgba(0,0,0,.25);">

  <!-- Black header -->
  <div style="background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 0 12px;gap:5px;">
    ${GRAD_CAP_SVG}
    <div style="color:#fff;font-size:17px;font-weight:700;line-height:1.25;text-align:center;letter-spacing:0.03em;">Sono<br>School</div>
  </div>

  <!-- Dark red banner -->
  <div style="background:#7B0000;padding:18px 0 0;text-align:center;">
    <div style="color:#fff;font-size:76px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;line-height:1;padding-bottom:18px;">SonoSchool</div>
  </div>
  <div style="background:#7B0000;display:flex;justify-content:center;padding-bottom:20px;">
    <div style="background:#fff;padding:9px 40px;font-size:18px;font-weight:700;color:#111;letter-spacing:0.03em;">Certificate Of Completion</div>
  </div>

  <!-- Gray body -->
  <div style="background:#D0D0D0;padding:22px 60px 18px;text-align:center;">
    <p style="font-size:16px;color:#333;font-style:italic;margin:0 0 5px;">This is to certify that</p>
    <p style="font-size:28px;font-weight:700;color:#111;margin:0 0 5px;">${studentName}</p>
    <p style="font-size:18px;font-weight:700;color:#111;margin:0 0 3px;">Successfully Completed the ${courseName}</p>
    <p style="font-size:16px;font-weight:700;color:#111;margin:0;">Online module of SonoSchool</p>
  </div>

  <!-- Footer grid rows -->
  <div style="background:#D0D0D0;padding:14px 48px 6px;">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px 16px;margin-bottom:12px;">
      ${fieldRow([
        [courseName,          "Course Name"],
        [date,                "Course Date"],
        [renewal,             "Recommended Renewal Date"],
        [code,                "Candidate Code"],
      ])}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px 16px;margin-bottom:8px;">
      ${fieldRow([
        ["SonoSchool",          "Training Center"],
        ["www.SonoSchool.org",  "Training Center Website"],
        ["info@sonoschool.org", "Training Center Email"],
        ["SonoSchool",          "Course Director"],
      ])}
    </div>
    <div style="text-align:center;padding:8px 0 12px;font-size:13px;color:#333;font-weight:500;">www.SonoSchool.org</div>
  </div>

</div>`;
}

// ─── print window (fallback) ──────────────────────────────────────────────────

export function openCertPrint(params) {
  const win = window.open("", "_blank", "width=1100,height=780");
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Certificate — ${params.courseName}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#c8c8c8;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px;}
  @media print{
    @page{size:A4 landscape;margin:0}
    body{background:#D0D0D0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    div{box-shadow:none!important;width:100%!important;}
  }
</style>
</head>
<body>${buildCertFragment(params)}</body>
<script>window.onload=function(){window.print()}<\/script>
</html>`);
  win.document.close();
}

// ─── automatic PDF download ───────────────────────────────────────────────────

/**
 * Renders the certificate into a hidden off-screen div, captures it with
 * html2canvas, converts to a PDF via jsPDF, and triggers an immediate download
 * — no print dialog, goes straight to the browser's Downloads folder.
 */
export async function downloadCertPdf(params) {
  // Dynamic imports keep these large libs out of the initial bundle
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  // Off-screen container — 1060 px wide matches the certificate template
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;z-index:-1;width:1060px;";
  container.innerHTML = buildCertFragment(params);
  document.body.appendChild(container);

  try {
    const certEl = container.firstElementChild;

    const canvas = await html2canvas(certEl, {
      scale: 2,               // 2× for crisp text
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#D0D0D0",
      logging: false,
    });

    const imgW = canvas.width;
    const imgH = canvas.height;

    // Create an A4-landscape PDF sized exactly to the rendered image
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [imgW / 2, imgH / 2],
      hotfixes: ["px_scaling"],
    });

    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      0,
      0,
      imgW / 2,
      imgH / 2
    );

    const safe = (params.courseName || "Certificate")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    pdf.save(`SonoSchool_${safe}_Certificate.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
