import TextField from "./TextField";
import TextAreaField from "./TextAreaField";
import ImageUploadField from "./ImageUploadField";

export default function RepeatingList({
  label,
  items,
  onChange,
  itemFields,
  emptyItem,
}) {
  const list = Array.isArray(items) ? items : [];

  function updateItem(index, fieldName, value) {
    const next = list.map((item, i) =>
      i === index ? { ...item, [fieldName]: value } : item
    );
    onChange(next);
  }

  function addItem() {
    onChange([...list, { ...emptyItem }]);
  }

  function removeItem(index) {
    onChange(list.filter((_, i) => i !== index));
  }

  function moveItem(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const next = [...list];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-bold uppercase tracking-widest text-[#333333]">
          {label}
        </label>

        <button
          type="button"
          onClick={addItem}
          className="text-xs font-bold text-[#D62828] hover:underline"
        >
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {list.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-[#DDDDDD] bg-white p-4"
          >
            <div className="flex items-center justify-end gap-2 mb-3">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="text-xs font-bold text-[#333333]/60 hover:text-[#D62828] disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === list.length - 1}
                className="text-xs font-bold text-[#333333]/60 hover:text-[#D62828] disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs font-bold text-[#D62828] hover:underline"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemFields.map((field) => {
                if (field.type === "image") {
                  return (
                    <ImageUploadField
                      key={field.name}
                      label={field.label}
                      value={item[field.name]}
                      onChange={(value) => updateItem(index, field.name, value)}
                    />
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div key={field.name} className="md:col-span-2">
                      <TextAreaField
                        label={field.label}
                        value={item[field.name]}
                        onChange={(value) => updateItem(index, field.name, value)}
                        required={field.required}
                      />
                    </div>
                  );
                }

                return (
                  <TextField
                    key={field.name}
                    label={field.label}
                    value={item[field.name]}
                    onChange={(value) => updateItem(index, field.name, value)}
                    required={field.required}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <p className="text-sm text-[#333333]/50 italic">
            Nothing here yet — click "+ Add" to create one.
          </p>
        )}
      </div>
    </div>
  );
}
