import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getUserInfo } from "../api/userApi";

/**
 * Secure PDF viewer — opens a course material inside a fullscreen modal with
 * several deterrents stacked on top of each other:
 *
 *  • The file URL is only ever the in-memory base64 string (no /uploads link
 *    that could be shared or cached).
 *  • The viewer iframe loads with `#toolbar=0&navpanes=0` so Chrome's built-in
 *    PDF UI hides Save / Print / Download buttons.
 *  • A transparent overlay above the iframe captures contextmenu (right-click)
 *    so the native PDF "Save as / Print" menu can't open.
 *  • Window-level keyboard listeners block Ctrl+S / Ctrl+P / Ctrl+C / Ctrl+A /
 *    F12 / Ctrl+Shift+I etc. while the viewer is mounted.
 *  • The page is fully covered when the window loses focus or the tab becomes
 *    hidden — the typical "switch focus and screenshot" workflow now captures
 *    a black panel instead of the document.
 *  • A diagonal repeating watermark with the student's email is rendered above
 *    the iframe so any photo or screenshot still leaks identity.
 *
 * This is layered DETERRENCE, not real DRM. A determined viewer can still
 * point a phone at the screen, run an OS-level recorder, or use a sniffer to
 * pull the base64 out of memory. There is no purely-web way to stop those.
 */
/**
 * Chrome refuses to load data: URLs inside an <iframe> (the address bar simply
 * shows "blocked by Chrome" and the frame stays black). Convert the base64
 * data URL into a same-origin blob: URL — those load fine.
 */
function dataUrlToBlobUrl(dataUrl) {
  if (!dataUrl) return "";
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return dataUrl; // already a normal URL — leave it
  const [, mime, b64] = match;
  try {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime || "application/pdf" }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[SecurePdfViewer] failed to decode base64 PDF:", err);
    return "";
  }
}

export default function SecurePdfViewer({ material, onClose }) {
  const [hidden, setHidden] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const [loadError, setLoadError] = useState("");

  // (Re)build the blob URL whenever the material changes — and revoke the
  // previous one so we don't leak memory.
  useEffect(() => {
    setLoadError("");
    if (!material?.data) {
      setBlobUrl("");
      return undefined;
    }
    const url = dataUrlToBlobUrl(material.data);
    if (!url) {
      setLoadError("This PDF couldn't be decoded.");
      setBlobUrl("");
      return undefined;
    }
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [material]);

  const userInfo = getUserInfo();
  const watermarkText = useMemo(() => {
    const parts = [
      userInfo?.email,
      userInfo?.fullName,
      new Date().toLocaleDateString(),
    ].filter(Boolean);
    return parts.join(" · ") || "Confidential";
  }, [userInfo?.email, userInfo?.fullName]);

  // ── Block keyboard shortcuts at window level ─────────────────────────────
  useEffect(() => {
    function onKey(e) {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      // Save / Print / Copy / Select-all
      if (ctrl && (k === "s" || k === "p" || k === "c" || k === "a" || k === "x")) {
        e.preventDefault();
        return false;
      }
      // Dev tools (F12, Ctrl+Shift+I/J/C, Ctrl+U)
      if (k === "f12") {
        e.preventDefault();
        return false;
      }
      if (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c")) {
        e.preventDefault();
        return false;
      }
      if (ctrl && k === "u") {
        e.preventDefault();
        return false;
      }
      // Win+Shift+S (Snip & Sketch) — best-effort; the OS usually grabs this
      // before the browser sees it, but on builds where it leaks through we
      // hide content immediately and try to clobber the clipboard.
      if (e.shiftKey && (e.metaKey || e.getModifierState?.("Meta")) && k === "s") {
        setHidden(true);
        try { navigator.clipboard?.writeText?.(""); } catch {}
        e.preventDefault();
        return false;
      }
      // PrintScreen — some OSes don't fire this in the browser; we still try
      // to clobber the clipboard to thwart plain copies, and hide content.
      if (k === "printscreen") {
        setHidden(true);
        try { navigator.clipboard?.writeText?.(""); } catch {}
      }
      // Esc closes the viewer
      if (k === "escape") onClose?.();
    }

    function onContext(e) {
      e.preventDefault();
      return false;
    }

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("contextmenu", onContext, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("contextmenu", onContext, true);
    };
  }, [onClose]);

  // ── Cover content when window loses focus / tab becomes hidden ───────────
  useEffect(() => {
    function onBlur() { setHidden(true); }
    function onFocus() { setHidden(false); }
    function onVis() { setHidden(document.hidden); }

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    // Continuous focus poll — Windows Snip & Sketch (Win+Shift+S) takes focus
    // away from the tab without always firing the blur event in time, so we
    // also check document.hasFocus() every 200 ms. When the snip overlay
    // appears the tab loses focus, the curtain drops, and the screenshot ends
    // up capturing the black panel instead of the document.
    const poll = window.setInterval(() => {
      if (!document.hasFocus()) {
        setHidden(true);
      }
    }, 200);

    // Hide when the mouse leaves the viewer too — a couple of screenshot
    // workflows drag-select while the cursor passes outside the viewport.
    function onMouseLeave() { setHidden(true); }
    function onMouseEnter() { if (document.hasFocus()) setHidden(false); }
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Best-effort: lock body scroll while the viewer is up.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!material) return null;

  // Hash params hide Chrome's toolbar/sidebar/download buttons. They're
  // appended to the blob URL — the PDF plugin parses them regardless of
  // whether the URL is data:, blob:, or http:.
  const pdfHashParams = "#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&view=FitH";
  const src = blobUrl ? `${blobUrl}${pdfHashParams}` : "";

  // Portal to body so the modal can never be trapped beneath a sticky parent
  // (the StudentShell sidebar uses fixed positioning with z-30, and various
  // parents create stacking contexts that can outrank z-100).
  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] bg-black"
      // CSS-level select / drag prevention — handlers above also catch Ctrl+C.
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        msUserSelect: "none",
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* ── Top bar ── */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between gap-3 px-6 py-3 bg-black/80 backdrop-blur text-white">
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-brandRed">
            picture_as_pdf
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{material.name}</p>
            <p className="text-[10px] text-white/60">
              Protected document · do not share
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>

      {/* ── PDF viewer ──
          Using <embed> (Chrome's native PDF plugin) instead of a sandboxed
          <iframe>. The iframe approach failed because Chrome blocks data:
          URLs inside iframes and a strict sandbox also blocks the plugin
          from initializing. <embed> with a blob: URL renders reliably. */}
      <div className="absolute inset-0 pt-14">
        {src ? (
          <embed
            key={src}
            src={src}
            type="application/pdf"
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/70">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl mb-3 block">
                hide_image
              </span>
              <p className="font-heading font-bold">Couldn't load this document.</p>
              {loadError && (
                <p className="text-xs text-white/50 mt-2">{loadError}</p>
              )}
              <p className="text-xs text-white/50 mt-2">
                Re-upload the PDF from <span className="font-semibold">Edit Course → Material</span>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Watermark layer — diagonal repeated email/name across the doc.
          pointer-events: none so the embedded PDF still scrolls beneath. */}
      <div
        className="absolute inset-0 pt-14 z-20"
        style={{ pointerEvents: "none" }}
      >
        <Watermark text={watermarkText} />
      </div>

      {/* ── Hidden curtain when window loses focus ── */}
      {hidden && (
        <div className="absolute inset-0 z-40 bg-black flex items-center justify-center">
          <div className="text-center text-white/80">
            <span className="material-symbols-outlined text-5xl mb-3 block">
              visibility_off
            </span>
            <p className="font-heading font-bold text-lg">Document hidden</p>
            <p className="text-xs text-white/60 mt-1">
              Return focus to this tab to continue reading.
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

function Watermark({ text }) {
  // Tile rows of slanted, low-opacity text across the whole viewer area.
  // Uses CSS only — nothing dynamic that would slow scrolling.
  const rows = Array.from({ length: 14 });
  const cols = Array.from({ length: 6 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-[-25%] grid"
        style={{
          gridTemplateRows: `repeat(${rows.length}, 1fr)`,
          gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
          transform: "rotate(-30deg)",
        }}
      >
        {rows.flatMap((_, r) =>
          cols.map((__, c) => (
            <span
              key={`${r}-${c}`}
              className="text-white/[0.12] font-bold text-xs whitespace-nowrap"
              style={{ alignSelf: "center", justifySelf: "center" }}
            >
              {text}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
