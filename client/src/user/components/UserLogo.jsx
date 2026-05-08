/**
 * SonoSchool brand logo — icon + wordmark.
 *
 * Extracted as a shared component because it appears in three places:
 *   1. UserNavbar (light background, charcoal text)
 *   2. UserLogin dark panel (dark background, white text)
 *   3. UserRegister card header (light background)
 *
 * Props:
 *   size  "md" (default) | "sm" — controls icon and text sizing
 *   dark  false (default) | true — switches wordmark from charcoal to white
 */
export default function UserLogo({ size = "md", dark = false }) {
  // Tailwind size tokens vary by the size prop.
  const icon = size === "sm" ? "w-6 h-6" : "w-7 h-7";
  const svg  = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const text = size === "sm" ? "text-base" : "text-lg";
  // Dark mode flips the wordmark so it's readable on charcoal/dark backgrounds.
  const nameColor = dark ? "text-white" : "text-charcoal";

  return (
    <div className="flex items-center gap-2">
      {/* Red rounded-square icon with a graduation-cap SVG */}
      <div className={`${icon} bg-brandRed rounded-lg flex items-center justify-center shrink-0`}>
        <svg className={`${svg} text-white`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
        </svg>
      </div>
      {/* "Sono" in the base color, "School" always in brandRed */}
      <span className={`font-heading font-bold ${text} ${nameColor}`}>
        Sono<span className="text-brandRed">School</span>
      </span>
    </div>
  );
}
