/**
 * Renders HTML produced by the admin RichTextEditor (Quill) safely.
 *
 *   • Strips <script>, on*= attributes and javascript:/data: URLs so admin
 *     content can't XSS the student. Pretty conservative — only the tags Quill
 *     actually emits (and inline color/background style) are allowed.
 *   • Falls back to plain-text rendering when value looks like a legacy plain
 *     string (no HTML tags), so courses created before rich text shipped don't
 *     lose their description.
 *
 *   value — string from the API (may be HTML or plain text)
 *   className — passes through to the outer div
 */
function isHtml(value) {
  return typeof value === "string" && /<[a-z][\s\S]*>/i.test(value);
}

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li",
  "a", "span",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote",
]);

function sanitize(html) {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  walk(doc.body);
  return doc.body.innerHTML;
}

function walk(node) {
  // Iterate over a snapshot — we mutate the tree while we go.
  const children = Array.from(node.children || []);
  for (const child of children) {
    const tag = child.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      // Replace disallowed elements with their text content so we don't
      // silently drop the user's words.
      child.replaceWith(...Array.from(child.childNodes));
      continue;
    }
    // Strip event handlers and dangerous URL schemes.
    for (const attr of Array.from(child.attributes)) {
      const name = attr.name.toLowerCase();
      const val = attr.value;
      if (name.startsWith("on")) child.removeAttribute(attr.name);
      else if ((name === "href" || name === "src") && /^\s*(javascript|data):/i.test(val)) {
        child.removeAttribute(attr.name);
      } else if (name !== "href" && name !== "style" && name !== "class" && name !== "target" && name !== "rel") {
        // Quill emits style="color: ..." on spans; class on lists; href/target on anchors.
        child.removeAttribute(attr.name);
      }
    }
    // Force external links to open in a new tab without leaking referrer.
    if (tag === "a") {
      child.setAttribute("target", "_blank");
      child.setAttribute("rel", "noopener noreferrer");
    }
    walk(child);
  }
}

export default function RichText({ value, className = "" }) {
  if (!value) return null;

  if (!isHtml(value)) {
    return <div className={className}>{value}</div>;
  }

  const safe = sanitize(value);
  return (
    <div
      className={`prose-rt ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
