// client/src/admin/components/siteContent/ImageUploadField.jsx
import { useState } from "react";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export default function ImageUploadField({ label, value, onChange }) {
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(
        `Image is too large (max ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))} MB).`
      );
      return;
    }

    setError("");

    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ""));
    reader.onerror = () => setError("Failed to read the image file.");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#333333] mb-2">
        {label}
      </label>

      {value && (
        <div className="mb-3 relative inline-block">
          <img
            src={value}
            alt=""
            className="w-24 h-24 object-cover rounded-xl border border-[#DDDDDD]"
          />

          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#D62828] text-white text-xs font-bold flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-[#333333]"
      />

      {error && <p className="text-xs text-[#D62828] mt-1">{error}</p>}
    </div>
  );
}
