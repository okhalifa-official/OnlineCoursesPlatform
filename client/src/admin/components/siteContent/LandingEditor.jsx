// client/src/admin/components/siteContent/LandingEditor.jsx
import { useState } from "react";
import TextField from "./TextField";
import TextAreaField from "./TextAreaField";
import ImageUploadField from "./ImageUploadField";
import RepeatingList from "./RepeatingList";
import AccordionSection from "./AccordionSection";

const SECTION_KEYS = [
  { key: "trusted", label: "Trusted By" },
  { key: "about", label: "About" },
  { key: "tracks", label: "Tracks" },
  { key: "why-us", label: "Why Us" },
  { key: "events", label: "Events" },
  { key: "verify", label: "Verify" },
  { key: "contact", label: "Contact" },
  { key: "footer-cta", label: "Footer CTA" },
];

const EMPTY_ITEM_FIELDS = [
  { name: "title", label: "Title", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

function findSection(sections, key) {
  return sections.find((s) => s.key === key) || {
    key,
    title: "",
    subtitle: "",
    body: "",
    imageUrl: "",
    buttonText: "",
    buttonLink: "",
    items: [],
  };
}

export default function LandingEditor({ hero, sections, onHeroChange, onSectionsChange }) {
  const [openSection, setOpenSection] = useState("hero");

  function updateHero(partial) {
    onHeroChange({ ...hero, ...partial });
  }

  function updateSection(key, partial) {
    const current = findSection(sections, key);
    const updated = { ...current, ...partial };
    const withoutKey = sections.filter((s) => s.key !== key);
    onSectionsChange([...withoutKey, updated]);
  }

  function toggleSection(key) {
    setOpenSection((current) => (current === key ? null : key));
  }

  return (
    <div className="space-y-3">
      <AccordionSection title="Hero Section" isOpen={openSection === "hero"} onToggle={() => toggleSection("hero")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Badge / Subtitle" value={hero.subtitle} onChange={(v) => updateHero({ subtitle: v })} />
          <TextField label="Title" value={hero.title} onChange={(v) => updateHero({ title: v })} />
          <TextField label="Headline Highlight" value={hero.headlineHighlight} onChange={(v) => updateHero({ headlineHighlight: v })} />
          <TextField label="Button Text" value={hero.buttonText} onChange={(v) => updateHero({ buttonText: v })} />
          <TextField label="Button Link" value={hero.buttonLink} onChange={(v) => updateHero({ buttonLink: v })} />
          <TextField label="Video Link" value={hero.videoUrl} onChange={(v) => updateHero({ videoUrl: v })} />

          <div className="md:col-span-2">
            <TextAreaField label="Description" value={hero.description} onChange={(v) => updateHero({ description: v })} />
          </div>

          <ImageUploadField label="Hero Image" value={hero.imageUrl} onChange={(v) => updateHero({ imageUrl: v })} />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Rating Value"
              value={String(hero.rating?.value ?? "")}
              onChange={(v) => updateHero({ rating: { ...hero.rating, value: Number(v) || 0 } })}
            />
            <TextField
              label="Rating Reviews"
              value={String(hero.rating?.reviews ?? "")}
              onChange={(v) => updateHero({ rating: { ...hero.rating, reviews: Number(v) || 0 } })}
            />
          </div>

          <TextField
            label="Workshop Badge Title"
            value={hero.workshopBadge?.title}
            onChange={(v) => updateHero({ workshopBadge: { ...hero.workshopBadge, title: v } })}
          />
          <TextField
            label="Workshop Badge Subtitle"
            value={hero.workshopBadge?.subtitle}
            onChange={(v) => updateHero({ workshopBadge: { ...hero.workshopBadge, subtitle: v } })}
          />
        </div>

        <RepeatingList
          label="Hero Stats"
          items={hero.stats || []}
          onChange={(items) => updateHero({ stats: items })}
          itemFields={[
            { name: "value", label: "Value", type: "text", required: true },
            { name: "label", label: "Label", type: "text" },
          ]}
          emptyItem={{ value: "", label: "" }}
        />
      </AccordionSection>

      {SECTION_KEYS.map(({ key, label }) => {
        const section = findSection(sections, key);

        return (
          <AccordionSection
            key={key}
            title={label}
            isOpen={openSection === key}
            onToggle={() => toggleSection(key)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField label="Eyebrow / Subtitle" value={section.subtitle} onChange={(v) => updateSection(key, { subtitle: v })} />
              <TextField label="Headline / Title" value={section.title} onChange={(v) => updateSection(key, { title: v })} />
              <TextField label="Button Text" value={section.buttonText} onChange={(v) => updateSection(key, { buttonText: v })} />
              <TextField label="Button Link" value={section.buttonLink} onChange={(v) => updateSection(key, { buttonLink: v })} />
            </div>

            <TextAreaField label="Body" value={section.body} onChange={(v) => updateSection(key, { body: v })} />

            <ImageUploadField label="Section Image" value={section.imageUrl} onChange={(v) => updateSection(key, { imageUrl: v })} />

            <RepeatingList
              label="Items"
              items={section.items || []}
              onChange={(items) => updateSection(key, { items })}
              itemFields={EMPTY_ITEM_FIELDS}
              emptyItem={{ title: "", description: "" }}
            />
          </AccordionSection>
        );
      })}
    </div>
  );
}
