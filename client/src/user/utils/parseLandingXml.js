/** Fetch and parse /data/landing-data.xml into a structured JS object. */
export async function fetchLandingData() {
  const res = await fetch("/data/landing-data.xml");
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "application/xml");

  const text$ = (parent, tag) => parent.querySelector(tag)?.textContent?.trim() ?? "";
  const attr  = (el, name)    => el?.getAttribute(name) ?? "";
  const els   = (parent, tag) => [...parent.querySelectorAll(tag)];

  return {
    hero: {
      badge:             text$(doc, "hero badge"),
      headline:          text$(doc, "hero headline"),
      headlineHighlight: text$(doc, "hero headlineHighlight"),
      subheadline:       text$(doc, "hero subheadline"),
      rating:            { value: attr(doc.querySelector("hero rating"), "value"), reviews: attr(doc.querySelector("hero rating"), "reviews") },
      workshopBadge:     { title: text$(doc, "hero workshopBadge title"), subtitle: text$(doc, "hero workshopBadge subtitle") },
      stats:             els(doc, "hero stat").map(el => ({ value: attr(el, "value"), label: attr(el, "label") })),
    },

    trusted: els(doc, "trusted institution").map(el => el.textContent.trim()),

    about: {
      eyebrow:  text$(doc, "about eyebrow"),
      headline: text$(doc, "about headline"),
      body:     text$(doc, "about body"),
      features: els(doc, "about feature").map(el => ({ title: attr(el, "title"), desc: attr(el, "desc") })),
      links:    els(doc, "about link").map(el => ({ label: attr(el, "label"), href: attr(el, "href") })),
    },

    tracks: els(doc, "tracks track").map(el => ({
      color: attr(el, "color"),
      label: attr(el, "label"),
      desc:  attr(el, "desc"),
    })),

    whyUs: {
      eyebrow:        text$(doc, "whyUs eyebrow"),
      headline:       text$(doc, "whyUs headline"),
      body:           text$(doc, "whyUs body"),
      pillarsHeading: text$(doc, "whyUs pillarsHeading"),
      stats:   els(doc, "whyUs stats stat").map(el => ({ value: attr(el, "value"), label: attr(el, "label") })),
      pillars: els(doc, "whyUs pillar").map(el => ({ color: attr(el, "color"), title: attr(el, "title"), desc: attr(el, "desc") })),
    },

    events: {
      eyebrow:  text$(doc, "events eyebrow"),
      headline: text$(doc, "events headline"),
      items:    els(doc, "events event").map(el => ({
        title:    attr(el, "title"),
        date:     attr(el, "date"),
        location: attr(el, "location"),
        seats:    Number(attr(el, "seats")),
      })),
    },

    verify: {
      eyebrow:     text$(doc, "verify eyebrow"),
      headline:    text$(doc, "verify headline"),
      body:        text$(doc, "verify body"),
      placeholder: text$(doc, "verify placeholder"),
      buttonLabel: text$(doc, "verify buttonLabel"),
    },

    contact: {
      eyebrow:  text$(doc, "contact eyebrow"),
      headline: text$(doc, "contact headline"),
      email:    text$(doc, "contact email"),
      phone:    text$(doc, "contact phone"),
      location: text$(doc, "contact location"),
    },

    footerCta: {
      eyebrow:     text$(doc, "footerCta eyebrow"),
      headline:    text$(doc, "footerCta headline"),
      body:        text$(doc, "footerCta body"),
      buttonLabel: text$(doc, "footerCta buttonLabel"),
    },
  };
}
