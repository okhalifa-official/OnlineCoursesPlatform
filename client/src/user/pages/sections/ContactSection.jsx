import { useLandingData } from "../../utils/LandingDataContext";

export default function ContactSection() {
  const data = useLandingData();
  const contact = data?.contact;

  return (
    <section id="contact" className="bg-softGrey py-20">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">{contact?.eyebrow}</p>
        <h2 className="font-heading font-black text-charcoal mb-10" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
          {contact?.headline}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Full name"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition"
            />
            <input
              type="email"
              placeholder="Email address"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition"
            />
            <textarea
              rows={4}
              placeholder="Your message"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-gray-300 focus:outline-none focus:border-brandRed transition resize-none"
            />
            <button className="bg-brandRed text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-sm self-start">
              Send message
            </button>
          </div>
          <div className="flex flex-col gap-4 text-sm text-gray-500">
            <p><span className="font-semibold text-charcoal">Email:</span> {contact?.email}</p>
            <p><span className="font-semibold text-charcoal">Phone:</span> {contact?.phone}</p>
            <p><span className="font-semibold text-charcoal">Location:</span> {contact?.location}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
