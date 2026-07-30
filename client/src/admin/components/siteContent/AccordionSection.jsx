export default function AccordionSection({ title, isOpen, onToggle, children }) {
  return (
    <div className="rounded-2xl border border-[#DDDDDD] bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-bold heading-font"
      >
        {title}
        <span className="text-[#333333]/60">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}
