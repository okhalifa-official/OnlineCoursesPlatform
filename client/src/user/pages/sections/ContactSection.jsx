import useSiteContent from "../../hooks/useSiteContent";

export default function ContactSection({ previewOverride } = {}) {
  const { getSection } = useSiteContent("landing");
  const cmsContact = previewOverride ?? getSection("contact");

  const eyebrow =
    cmsContact?.subtitle ||
    "Contact";

  const headline =
    cmsContact?.title ||
    "Get in touch with us";

  const body =
    cmsContact?.body ||
    "";

  const email =
    cmsContact?.items?.find((item) => item.key === "email")?.value ||
    cmsContact?.items?.find((item) => item.title === "Email")?.description ||
    "support@sonoschool.com";

  const phone =
    cmsContact?.items?.find((item) => item.key === "phone")?.value ||
    cmsContact?.items?.find((item) => item.title === "Phone")?.description ||
    "+20 100 000 0000";

  const location =
    cmsContact?.items?.find((item) => item.key === "location")?.value ||
    cmsContact?.items?.find((item) => item.title === "Location")?.description ||
    "Egypt";

  const buttonText =
    cmsContact?.buttonText ||
    "Send message";

  return (
    <section id="contact" className="bg-softGrey py-20">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-brandRed text-xs font-bold uppercase tracking-widest mb-3">
          {eyebrow}
        </p>

        <h2
          className="font-heading font-black text-charcoal mb-5"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
        >
          {headline}
        </h2>

        {body && (
          <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-2xl whitespace-pre-line">
            {body}
          </p>
        )}

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

            <button
              type="button"
              className="bg-brandRed text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-sm self-start"
            >
              {buttonText}
            </button>
          </div>

          <div className="flex flex-col gap-4 text-sm text-gray-500">
            <p>
              <span className="font-semibold text-charcoal">Email:</span>{" "}
              {email}
            </p>

            <p>
              <span className="font-semibold text-charcoal">Phone:</span>{" "}
              {phone}
            </p>

            <p>
              <span className="font-semibold text-charcoal">Location:</span>{" "}
              {location}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
