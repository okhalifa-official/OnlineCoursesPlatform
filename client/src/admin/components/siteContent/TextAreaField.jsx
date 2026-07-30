export default function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  required = false,
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </label>

      <textarea
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] px-4 py-3 outline-none focus:border-[#D62828] resize-y"
      />
    </div>
  );
}
