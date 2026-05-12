import { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/**
 * Thin wrapper around Quill so the admin form can produce HTML with the
 * features the client asked for (links, colors, bold, lists). The toolbar is
 * deliberately compact — Quill's full toolbar is overwhelming for a course
 * description / FAQ answer.
 *
 *   value     — current HTML string ("" when empty)
 *   onChange  — receives the new HTML on edit
 *   placeholder — placeholder text for an empty editor
 *   minHeight — px height the editing surface stays at
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "",
  minHeight = 140,
}) {
  // Memoize modules so Quill doesn't rebuild its toolbar on every render.
  const modules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="rte-wrap" style={{ "--rte-min-height": `${minHeight}px` }}>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
      <style>{`
        .rte-wrap .ql-toolbar.ql-snow {
          border-radius: 8px 8px 0 0;
          border-color: #E4E4E4;
          background: #FAFAFA;
        }
        .rte-wrap .ql-container.ql-snow {
          border-radius: 0 0 8px 8px;
          border-color: #E4E4E4;
          background: #F7F7F7;
          font-family: inherit;
          font-size: 14px;
        }
        .rte-wrap .ql-editor {
          min-height: var(--rte-min-height);
        }
        .rte-wrap .ql-editor.ql-blank::before {
          font-style: normal;
          color: #999;
        }
      `}</style>
    </div>
  );
}
