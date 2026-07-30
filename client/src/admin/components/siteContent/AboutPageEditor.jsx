import { useEffect, useState } from "react";
import TextField from "./TextField";
import TextAreaField from "./TextAreaField";
import RepeatingList from "./RepeatingList";
import AccordionSection from "./AccordionSection";
import { ABOUT_PAGE_FIELD_DEFS } from "./aboutPageFieldDefs";

export default function AboutPageEditor({ pageKey, pageData, onChange }) {
  const def = ABOUT_PAGE_FIELD_DEFS[pageKey];
  const [openPanel, setOpenPanel] = useState("main");

  useEffect(() => {
    setOpenPanel("main");
  }, [pageKey]);

  if (!def) {
    return (
      <p className="text-sm text-[#333333]/60">
        No editor is defined for this page yet.
      </p>
    );
  }

  function updateData(partial) {
    onChange({ ...pageData, ...partial });
  }

  function togglePanel(name) {
    setOpenPanel((current) => (current === name ? null : name));
  }

  if (def.type === "flat-list") {
    return (
      <AccordionSection title={def.label} isOpen={openPanel === "main"} onToggle={() => togglePanel("main")}>
        <RepeatingList
          label={def.label}
          items={pageData?.[def.arrayKey] || []}
          onChange={(items) => updateData({ [def.arrayKey]: items })}
          itemFields={def.itemFields}
          emptyItem={def.emptyItem}
        />
      </AccordionSection>
    );
  }

  if (def.type === "grouped-list") {
    const groups = pageData?.[def.arrayKey] || [];

    function updateGroup(index, partial) {
      const next = groups.map((g, i) => (i === index ? { ...g, ...partial } : g));
      updateData({ [def.arrayKey]: next });
    }

    function addGroup() {
      updateData({ [def.arrayKey]: [...groups, { ...def.emptyGroup, [def.memberArrayKey]: [] }] });
    }

    function removeGroup(index) {
      updateData({ [def.arrayKey]: groups.filter((_, i) => i !== index) });
    }

    return (
      <AccordionSection title={def.label} isOpen={openPanel === "main"} onToggle={() => togglePanel("main")}>
        <div className="flex items-center justify-end mb-3">
          <button
            type="button"
            onClick={addGroup}
            className="text-xs font-bold text-[#D62828] hover:underline"
          >
            + Add Country
          </button>
        </div>

        <div className="space-y-6">
          {groups.map((group, index) => (
            <div key={index} className="rounded-2xl border border-[#DDDDDD] bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                {def.groupFields.map((field) => (
                  <div key={field.name} className="flex-1 mr-3">
                    <TextField
                      label={field.label}
                      value={group[field.name]}
                      onChange={(value) => updateGroup(index, { [field.name]: value })}
                      required={field.required}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => removeGroup(index)}
                  className="text-xs font-bold text-[#D62828] hover:underline shrink-0"
                >
                  Remove Country
                </button>
              </div>

              <RepeatingList
                label={`${group.name || "Country"} — Members`}
                items={group[def.memberArrayKey] || []}
                onChange={(members) => updateGroup(index, { [def.memberArrayKey]: members })}
                itemFields={def.memberFields}
                emptyItem={def.emptyMember}
              />
            </div>
          ))}

          {groups.length === 0 && (
            <p className="text-sm text-[#333333]/50 italic">
              No countries yet — click "+ Add Country" to create one.
            </p>
          )}
        </div>
      </AccordionSection>
    );
  }

  if (def.kind === "mission-vision") {
    const mission = pageData?.mission || { eyebrow: "", body: "" };
    const vision = pageData?.vision || { eyebrow: "", body: "" };
    const values = pageData?.values || [];

    return (
      <div className="space-y-4">
        <AccordionSection title="Mission" isOpen={openPanel === "mission"} onToggle={() => togglePanel("mission")}>
          <TextField
            label="Mission Eyebrow"
            value={mission.eyebrow}
            onChange={(value) => updateData({ mission: { ...mission, eyebrow: value } })}
          />
          <TextAreaField
            label="Mission Body"
            value={mission.body}
            onChange={(value) => updateData({ mission: { ...mission, body: value } })}
          />
        </AccordionSection>

        <AccordionSection title="Vision" isOpen={openPanel === "vision"} onToggle={() => togglePanel("vision")}>
          <TextField
            label="Vision Eyebrow"
            value={vision.eyebrow}
            onChange={(value) => updateData({ vision: { ...vision, eyebrow: value } })}
          />
          <TextAreaField
            label="Vision Body"
            value={vision.body}
            onChange={(value) => updateData({ vision: { ...vision, body: value } })}
          />
        </AccordionSection>

        <AccordionSection title="Values" isOpen={openPanel === "values"} onToggle={() => togglePanel("values")}>
          <RepeatingList
            label="Values"
            items={values}
            onChange={(items) => updateData({ values: items })}
            itemFields={[
              { name: "title", label: "Title", type: "text", required: true },
              { name: "desc", label: "Description", type: "textarea" },
            ]}
            emptyItem={{ title: "", desc: "" }}
          />
        </AccordionSection>
      </div>
    );
  }

  if (def.kind === "policies") {
    const policies = pageData?.policies || [];

    function updatePolicy(index, partial) {
      const next = policies.map((p, i) => (i === index ? { ...p, ...partial } : p));
      updateData({ policies: next });
    }

    function addPolicy() {
      updateData({
        policies: [
          ...policies,
          { title: "", slug: "", lastUpdated: "", sections: [] },
        ],
      });
    }

    function removePolicy(index) {
      updateData({ policies: policies.filter((_, i) => i !== index) });
    }

    return (
      <AccordionSection title="Policies" isOpen={openPanel === "main"} onToggle={() => togglePanel("main")}>
        <div className="flex items-center justify-end mb-3">
          <button
            type="button"
            onClick={addPolicy}
            className="text-xs font-bold text-[#D62828] hover:underline"
          >
            + Add Policy
          </button>
        </div>

        <div className="space-y-6">
          {policies.map((policy, index) => (
            <div key={index} className="rounded-2xl border border-[#DDDDDD] bg-white p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <TextField
                  label="Title"
                  value={policy.title}
                  onChange={(value) => updatePolicy(index, { title: value })}
                  required
                />
                <TextField
                  label="Slug"
                  value={policy.slug}
                  onChange={(value) => updatePolicy(index, { slug: value })}
                  required
                />
                <TextField
                  label="Last Updated"
                  value={policy.lastUpdated}
                  onChange={(value) => updatePolicy(index, { lastUpdated: value })}
                />
              </div>

              <RepeatingList
                label="Sections"
                items={policy.sections || []}
                onChange={(sections) => updatePolicy(index, { sections })}
                itemFields={[
                  { name: "heading", label: "Heading", type: "text", required: true },
                  { name: "body", label: "Body", type: "textarea" },
                ]}
                emptyItem={{ heading: "", body: "" }}
              />

              <button
                type="button"
                onClick={() => removePolicy(index)}
                className="mt-4 text-xs font-bold text-[#D62828] hover:underline"
              >
                Remove Policy
              </button>
            </div>
          ))}

          {policies.length === 0 && (
            <p className="text-sm text-[#333333]/50 italic">
              No policies yet — click "+ Add Policy" to create one.
            </p>
          )}
        </div>
      </AccordionSection>
    );
  }

  return null;
}
