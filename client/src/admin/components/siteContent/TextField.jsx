export default function TextField({ label, value, onChange, required = false }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </label>

      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-12 rounded-xl border border-[#DDDDDD] bg-[#F2F2F2] px-4 outline-none focus:border-[#D62828]"
      />
    </div>
  );
}
