import { useState } from "react";
import { Link } from "react-router-dom";
import RichTextEditor from "./RichTextEditor";

export const emptyCourse = {
  courseName: "",
  courseDescription: "",
  coursePrice: "",
  publishStatus: "Draft",
  previewImage: "",
  previewVideoName: "",
  previewVideoFile: "",
  previewVideoURL: "",
  courseFilesNames: [],
  lessonAssetsNames: [],
  instructors: [],
  faqs: [],
  modules: [],
  materials: [],
  exam: {
    enabled: false,
    durationMinutes: 30,
    passingScore: 70,
    attempts: 1,
    antiCheat: false,
    maxTabSwitches: 3,
    allowPrevious: true,
    showQuestionMarks: true,
    reviewMode: "immediately",
    reviewOpensAt: "",
    questions: [],
  },
};

export default function CourseForm({
  mode = "add",
  formData,
  setFormData,
  onSubmit,
  saving,
}) {
  const [editingLesson, setEditingLesson] = useState(null);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function setStatus(status) {
    setFormData({
      ...formData,
      publishStatus: status,
    });
  }

  function handlePreviewImageChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = function () {
      setFormData({
        ...formData,
        previewImage: reader.result,
      });
    };

    reader.readAsDataURL(file);
  }

  function removePreviewImage() {
    setFormData({
      ...formData,
      previewImage: "",
    });
  }

  function handlePreviewVideoChange(e) {
    const file = e.target.files[0];

    if (!file) {
      setFormData({
        ...formData,
        previewVideoName: "",
        previewVideoFile: "",
      });
      return;
    }

    // 10 MB cap to keep the embedded base64 below the 16 MB MongoDB document
    // limit (base64 inflates the payload by ~33%). Larger previews should use
    // the URL field instead.
    if (file.size > 10 * 1024 * 1024) {
      alert("Preview video is too large. Max 10 MB for direct upload — use the Preview Video URL field for larger files.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        previewVideoName: file.name,
        previewVideoFile: reader.result,
      });
    };
    reader.readAsDataURL(file);
  }

  function removePreviewVideo() {
    setFormData({
      ...formData,
      previewVideoName: "",
      previewVideoFile: "",
    });
  }

  function handleCourseFilesChange(e) {
    const files = Array.from(e.target.files).map((file) => file.name);

    setFormData({
      ...formData,
      courseFilesNames: files,
    });
  }

  function handleLessonAssetsChange(e) {
    const files = Array.from(e.target.files).map((file) => file.name);

    setFormData({
      ...formData,
      lessonAssetsNames: files,
    });
  }

  // ── Instructors ──────────────────────────────────────────────────────────
  function addInstructor() {
    setFormData({
      ...formData,
      instructors: [...(formData.instructors || []), { name: "" }],
    });
  }

  function updateInstructor(index, value) {
    const next = [...(formData.instructors || [])];
    next[index] = { ...next[index], name: value };
    setFormData({ ...formData, instructors: next });
  }

  function removeInstructor(index) {
    const next = (formData.instructors || []).filter((_, i) => i !== index);
    setFormData({ ...formData, instructors: next });
  }

  // ── FAQs ─────────────────────────────────────────────────────────────────
  function addFaq() {
    setFormData({
      ...formData,
      faqs: [...(formData.faqs || []), { question: "", answer: "" }],
    });
  }

  function updateFaq(index, field, value) {
    const next = [...(formData.faqs || [])];
    next[index] = { ...next[index], [field]: value };
    setFormData({ ...formData, faqs: next });
  }

  function removeFaq(index) {
    const next = (formData.faqs || []).filter((_, i) => i !== index);
    setFormData({ ...formData, faqs: next });
  }

  // ── Course materials (PDFs) ──────────────────────────────────────────────
  function handleAddMaterials(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            // 10 MB cap to keep the entire course doc under MongoDB's 16 MB limit
            // (base64 inflates the payload by ~33%).
            if (file.size > 10 * 1024 * 1024) {
              alert(`"${file.name}" is larger than 10 MB and was skipped.`);
              return resolve(null);
            }
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve({
                name: file.name,
                mimeType: file.type || "application/pdf",
                data: reader.result,
                sizeKB: Math.round(file.size / 1024),
              });
            reader.readAsDataURL(file);
          })
      )
    ).then((added) => {
      const valid = added.filter(Boolean);
      if (valid.length === 0) return;
      setFormData({
        ...formData,
        materials: [...(formData.materials || []), ...valid],
      });
      // Allow re-uploading the same file later in this session.
      e.target.value = "";
    });
  }

  function removeMaterial(index) {
    setFormData({
      ...formData,
      materials: (formData.materials || []).filter((_, i) => i !== index),
    });
  }

  // ── Modules / Lessons ────────────────────────────────────────────────────
  function addModule() {
    const modules = formData.modules || [];
    const newModuleNumber = String(modules.length + 1).padStart(2, "0");

    setFormData({
      ...formData,
      modules: [
        ...modules,
        {
          title: `New Module ${newModuleNumber}`,
          lessons: [],
        },
      ],
    });
  }

  function editModule(moduleIndex) {
    const currentTitle = formData.modules[moduleIndex].title;
    const newTitle = window.prompt("Edit module name", currentTitle);

    if (!newTitle || !newTitle.trim()) return;

    const updatedModules = [...formData.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      title: newTitle.trim(),
    };

    setFormData({
      ...formData,
      modules: updatedModules,
    });
  }

  function deleteModule(moduleIndex) {
    const updatedModules = formData.modules.filter(
      (_, index) => index !== moduleIndex
    );

    setFormData({
      ...formData,
      modules: updatedModules,
    });
  }

  function addLesson(moduleIndex) {
    const updatedModules = formData.modules.map((m, i) =>
      i === moduleIndex
        ? {
            ...m,
            lessons: [
              ...(m.lessons || []),
              {
                title: `Lecture ${(m.lessons || []).length + 1}`,
                type: "video",
                duration: "",
                videoSource: "url",
                videoURL: "",
                videoFile: "",
                description: "",
              },
            ],
          }
        : m
    );

    setFormData({
      ...formData,
      modules: updatedModules,
    });

    // Open the editor immediately on the new lesson so the admin can fill it in.
    const newLessonIndex = (formData.modules[moduleIndex].lessons || []).length;
    setEditingLesson({ mi: moduleIndex, li: newLessonIndex });
  }

  function editLesson(moduleIndex, lessonIndex) {
    setEditingLesson({ mi: moduleIndex, li: lessonIndex });
  }

  function updateLessonFields(moduleIndex, lessonIndex, fields) {
    const updatedModules = formData.modules.map((m, i) =>
      i === moduleIndex
        ? {
            ...m,
            lessons: m.lessons.map((l, j) =>
              j === lessonIndex ? { ...l, ...fields } : l
            ),
          }
        : m
    );

    setFormData({
      ...formData,
      modules: updatedModules,
    });
  }

  function deleteLesson(moduleIndex, lessonIndex) {
    const updatedModules = formData.modules.map((m, i) =>
      i === moduleIndex
        ? { ...m, lessons: m.lessons.filter((_, j) => j !== lessonIndex) }
        : m
    );

    setFormData({
      ...formData,
      modules: updatedModules,
    });
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] pt-10 pb-16 px-6">
      <form onSubmit={onSubmit} className="max-w-6xl mx-auto">
        <header className="mb-10">
          <Link
            to="/admin/courses"
            className="inline-flex items-center text-[#D62828] text-sm font-medium mb-4 hover:gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-sm mr-1">
              arrow_back
            </span>
            Back to Courses
          </Link>

          <div className="flex justify-between items-end gap-6 flex-wrap">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight leading-none mb-2 heading-font">
                {mode === "add" ? "Create New Course" : "Edit Course"}
              </h1>
              <p className="text-[#333333] text-lg">
                Design a premium learning experience for your students.
              </p>
            </div>

            <div className="flex gap-4 w-full sm:w-auto">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none px-8 py-3 rounded-lg font-bold text-white bg-[#D62828] active:scale-95 duration-100 transition-all hover:bg-[#B92323] heading-font disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : mode === "add"
                  ? "Create Course"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* ── Basic Information ── */}
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 heading-font">
                <span className="material-symbols-outlined text-[#D62828]">
                  info
                </span>
                Basic Information
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#333333] px-1">
                    Course Name
                  </label>
                  <input
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleChange}
                    className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828] transition-all outline-none"
                    placeholder="e.g. Advanced Architectural Principles"
                    type="text"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#333333] px-1">
                    Description
                  </label>
                  <RichTextEditor
                    value={formData.courseDescription || ""}
                    onChange={(html) =>
                      setFormData({ ...formData, courseDescription: html })
                    }
                    placeholder="Provide a detailed overview of what students will achieve..."
                    minHeight={180}
                  />
                </div>
              </div>
            </section>

            {/* ── Instructors ── */}
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <h2 className="text-xl font-bold flex items-center gap-2 heading-font">
                  <span className="material-symbols-outlined text-[#D62828]">
                    person
                  </span>
                  Instructors
                </h2>

                <button
                  type="button"
                  onClick={addInstructor}
                  className="text-sm font-bold text-[#D62828] flex items-center gap-1 hover:bg-[#D62828]/5 px-3 py-1.5 rounded-lg transition-all heading-font"
                >
                  <span className="material-symbols-outlined text-lg">
                    add_circle
                  </span>
                  Add Instructor
                </button>
              </div>

              <div className="space-y-3">
                {(formData.instructors || []).length === 0 && (
                  <p className="text-sm text-[#666] italic">
                    No instructors added yet.
                  </p>
                )}

                {(formData.instructors || []).map((ins, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={ins.name}
                      onChange={(e) => updateInstructor(i, e.target.value)}
                      placeholder="Instructor full name"
                      className="flex-1 bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828] transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstructor(i)}
                      className="p-2 text-[#D62828] hover:bg-[#D62828]/5 rounded-lg transition-all"
                      title="Remove instructor"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ── FAQs ── */}
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <h2 className="text-xl font-bold flex items-center gap-2 heading-font">
                  <span className="material-symbols-outlined text-[#D62828]">
                    quiz
                  </span>
                  Frequently Asked Questions
                </h2>

                <button
                  type="button"
                  onClick={addFaq}
                  className="text-sm font-bold text-[#D62828] flex items-center gap-1 hover:bg-[#D62828]/5 px-3 py-1.5 rounded-lg transition-all heading-font"
                >
                  <span className="material-symbols-outlined text-lg">
                    add_circle
                  </span>
                  Add FAQ
                </button>
              </div>

              <div className="space-y-4">
                {(formData.faqs || []).length === 0 && (
                  <p className="text-sm text-[#666] italic">
                    No FAQs added yet.
                  </p>
                )}

                {(formData.faqs || []).map((faq, i) => (
                  <div
                    key={i}
                    className="border border-[#E4E4E4] rounded-lg p-4 bg-[#FAFAFA] relative"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D62828]">
                        FAQ {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFaq(i)}
                        className="p-1 text-[#666] hover:text-[#D62828] transition-all"
                        title="Remove FAQ"
                      >
                        <span className="material-symbols-outlined text-lg">
                          delete
                        </span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(i, "question", e.target.value)}
                      placeholder="Question"
                      className="w-full bg-white border border-[#E4E4E4] rounded-lg px-4 py-2.5 mb-2 focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828] transition-all outline-none"
                    />
                    <RichTextEditor
                      value={faq.answer || ""}
                      onChange={(html) => updateFaq(i, "answer", html)}
                      placeholder="Answer (supports bold, links, colors, lists)"
                      minHeight={100}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* ── Material (PDF) ── */}
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <div className="flex justify-between items-center mb-2 gap-4 flex-wrap">
                <h2 className="text-xl font-bold flex items-center gap-2 heading-font">
                  <span className="material-symbols-outlined text-[#D62828]">
                    picture_as_pdf
                  </span>
                  Material
                </h2>

                <label className="text-sm font-bold text-[#D62828] flex items-center gap-1 hover:bg-[#D62828]/5 px-3 py-1.5 rounded-lg transition-all heading-font cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleAddMaterials}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Add file
                </label>
              </div>
              <p className="text-xs text-[#666] mb-5">
                PDFs that students can read inside the secure viewer. Max 10 MB per file.
              </p>

              {(formData.materials || []).length === 0 ? (
                <p className="text-sm text-[#666] italic bg-[#FAFAFA] border border-dashed border-[#D6D6D6] rounded-lg p-6 text-center">
                  No material uploaded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.materials.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 bg-[#FAFAFA] border border-[#E4E4E4] rounded-lg"
                    >
                      <span className="material-symbols-outlined text-[#D62828]">
                        picture_as_pdf
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{m.name}</p>
                        <p className="text-[11px] text-[#666]">
                          {m.sizeKB ? `${m.sizeKB} KB` : "—"} · {m.mimeType || "PDF"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMaterial(i)}
                        className="p-1.5 text-[#666] hover:text-[#D62828] transition"
                        title="Remove file"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Curriculum Builder ── */}
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <h2 className="text-xl font-bold flex items-center gap-2 heading-font">
                  <span className="material-symbols-outlined text-[#D62828]">
                    architecture
                  </span>
                  Curriculum Builder
                </h2>

                <button
                  type="button"
                  onClick={addModule}
                  className="text-sm font-bold text-[#D62828] flex items-center gap-1 hover:bg-[#D62828]/5 px-3 py-1.5 rounded-lg transition-all heading-font"
                >
                  <span className="material-symbols-outlined text-lg">
                    add_circle
                  </span>
                  Add Module
                </button>
              </div>

              <div className="space-y-6">
                {(formData.modules || []).length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-[#D6D6D6] rounded-xl">
                    <span className="material-symbols-outlined text-[#D62828] text-4xl mb-2 inline-block">
                      video_library
                    </span>
                    <p className="font-bold text-[#1A1A1A]">No modules yet</p>
                    <p className="text-xs text-[#666] mt-1">
                      Click "Add Module" to start building your curriculum.
                    </p>
                  </div>
                )}

                {(formData.modules || []).map((module, moduleIndex) => (
                  <div
                    key={moduleIndex}
                    className="border-l-4 border-[#D62828] bg-[#FAFAFA] rounded-r-xl overflow-hidden"
                  >
                    <div className="px-6 py-4 flex justify-between items-center bg-[#FAFAFA]">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black bg-[#D62828] text-white w-6 h-6 flex items-center justify-center rounded">
                          {String(moduleIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="font-bold heading-font">
                          {module.title}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editModule(moduleIndex)}
                          className="p-1 hover:text-[#D62828] transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteModule(moduleIndex)}
                          className="p-1 hover:text-[#BA1A1A] transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      {(module.lessons || []).map((lesson, lessonIndex) => (
                        <div
                          key={lessonIndex}
                          className="flex items-center justify-between p-4 bg-white rounded-lg group hover:ring-1 hover:ring-[#D62828]/20 transition-all border border-[#E4E4E4]"
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`material-symbols-outlined ${
                                lesson.type === "pdf"
                                  ? "text-[#D62828]"
                                  : "text-[#0A5E35]"
                              }`}
                            >
                              {lesson.type === "pdf"
                                ? "description"
                                : "play_circle"}
                            </span>

                            <div>
                              <p className="text-sm font-semibold">
                                {lesson.title}
                              </p>

                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-[#333333] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">
                                    {lesson.type === "pdf"
                                      ? "article"
                                      : "videocam"}
                                  </span>
                                  {lesson.type}
                                </span>

                                <span className="text-[10px] uppercase tracking-widest font-bold text-[#333333] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">
                                    schedule
                                  </span>
                                  {lesson.duration}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                editLesson(moduleIndex, lessonIndex)
                              }
                              className="text-[#333333] hover:text-[#D62828]"
                            >
                              <span className="material-symbols-outlined text-lg">
                                edit
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteLesson(moduleIndex, lessonIndex)
                              }
                              className="text-[#333333] hover:text-[#BA1A1A]"
                            >
                              <span className="material-symbols-outlined text-lg">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addLesson(moduleIndex)}
                        className="w-full py-3 border-2 border-dashed border-[#D6D6D6] rounded-lg text-sm font-medium text-[#333333] hover:border-[#D62828] hover:text-[#D62828] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">
                          add
                        </span>
                        Add Lecture
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Course Exam ── */}
            <ExamSection
              exam={formData.exam || emptyCourse.exam}
              onChange={(exam) => setFormData({ ...formData, exam })}
            />
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* ── Visual Identity (Preview Image) with hover controls ── */}
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 heading-font">
                <span className="material-symbols-outlined text-[#D62828]">
                  image
                </span>
                Visual Identity
              </h2>

              {formData.previewImage ? (
                <div className="relative group rounded-lg overflow-hidden aspect-video border border-[#E4E4E4]">
                  <img
                    src={formData.previewImage}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer flex items-center gap-1.5 bg-white text-[#1A1A1A] px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#F2F2F2] transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePreviewImageChange}
                        className="hidden"
                      />
                      <span className="material-symbols-outlined text-base">
                        sync
                      </span>
                      Change
                    </label>
                    <button
                      type="button"
                      onClick={removePreviewImage}
                      className="flex items-center gap-1.5 bg-[#D62828] text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#B92323] transition-all"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="relative group cursor-pointer overflow-hidden rounded-lg aspect-video bg-[#FAFAFA] border-2 border-dashed border-[#D6D6D6] flex flex-col items-center justify-center hover:bg-[#F5F5F5] transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePreviewImageChange}
                    className="hidden"
                  />
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="material-symbols-outlined text-[#D62828] text-3xl mb-2">
                      upload_file
                    </span>
                    <p className="text-sm font-bold">Upload Preview Image</p>
                    <p className="text-xs text-[#333333] mt-1">
                      16:9 ratio recommended
                    </p>
                  </div>
                </label>
              )}
            </section>

            {/* ── Course Media & Files ── */}
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 heading-font">
                <span className="material-symbols-outlined text-[#D62828]">
                  folder_managed
                </span>
                Course Media & Files
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#333333] px-1">
                    Preview Video URL
                  </label>
                  <input
                    name="previewVideoURL"
                    value={formData.previewVideoURL || ""}
                    onChange={handleChange}
                    placeholder="YouTube, Vimeo, or direct video URL"
                    className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828] transition-all outline-none text-sm"
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <UploadBox
                    title="Upload Preview Video"
                    text={
                      formData.previewVideoFile
                        ? `Uploaded · ${formData.previewVideoName || "video"}`
                        : formData.previewVideoName || "Max 10 MB · MP4, MOV, WEBM"
                    }
                    icon="video_file"
                    accept="video/*"
                    onChange={handlePreviewVideoChange}
                  />
                  {formData.previewVideoFile && (
                    <button
                      type="button"
                      onClick={removePreviewVideo}
                      className="text-xs font-semibold text-[#D62828] hover:underline px-1"
                    >
                      Remove uploaded video
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[#666] italic">
                  PDF reading material is uploaded in the dedicated <span className="font-semibold">Material</span> section above.
                </p>
              </div>
            </section>

            {/* ── Pricing & Visibility ── */}
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 heading-font">
                <span className="material-symbols-outlined text-[#D62828]">
                  payments
                </span>
                Pricing & Visibility
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#333333] px-1">
                    Course Price (USD)
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#D62828]">
                      $
                    </span>

                    <input
                      name="coursePrice"
                      value={formData.coursePrice}
                      onChange={handleChange}
                      className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg pl-8 pr-4 py-3 focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828] transition-all outline-none font-bold"
                      placeholder="0.00"
                      type="number"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4E4E4]">
                  <label className="text-sm font-semibold text-[#333333] block mb-4">
                    Publishing Status
                  </label>

                  <div className="flex bg-[#FAFAFA] p-1 rounded-full relative border border-[#E4E4E4]">
                    <button
                      type="button"
                      onClick={() => setStatus("Draft")}
                      className={`flex-1 py-2 text-xs font-bold rounded-full z-10 transition-all heading-font ${
                        formData.publishStatus === "Draft"
                          ? "bg-white text-[#D62828] shadow-sm"
                          : "text-[#333333] hover:text-[#1A1A1A]"
                      }`}
                    >
                      Draft
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus("Published")}
                      className={`flex-1 py-2 text-xs font-bold rounded-full z-10 transition-all heading-font ${
                        formData.publishStatus === "Published"
                          ? "bg-white text-[#D62828] shadow-sm"
                          : "text-[#333333] hover:text-[#1A1A1A]"
                      }`}
                    >
                      Published
                    </button>
                  </div>

                  <p className="text-[10px] text-[#333333] mt-3 text-center px-4">
                    {formData.publishStatus === "Draft"
                      ? "Only published courses will be visible to potential students in the marketplace."
                      : "This course will be visible to students in the marketplace."}
                  </p>
                </div>
              </div>
            </section>

            <div className="p-6 bg-[#EAF7EF] rounded-xl border border-[#0A5E35]/10 shadow-card">
              <h3 className="text-sm font-bold text-[#0A5E35] flex items-center gap-2 mb-3 heading-font">
                <span className="material-symbols-outlined text-lg">
                  lightbulb
                </span>
                Instructor Tip
              </h3>
              <p className="text-xs text-[#0A5E35] leading-relaxed">
                Courses with at least 5 modules and a clear preview video tend
                to have higher enrollment rates.
              </p>
            </div>
          </div>
        </div>
      </form>

      {editingLesson && (
        <LessonEditorModal
          lesson={
            formData.modules[editingLesson.mi]?.lessons[editingLesson.li]
          }
          onSave={(fields) => {
            updateLessonFields(editingLesson.mi, editingLesson.li, fields);
            setEditingLesson(null);
          }}
          onClose={() => setEditingLesson(null)}
        />
      )}
    </main>
  );
}

function LessonEditorModal({ lesson, onSave, onClose }) {
  const [draft, setDraft] = useState({
    title: lesson?.title || "",
    type: lesson?.type || "video",
    duration: lesson?.duration || "",
    videoSource: lesson?.videoSource || "url",
    videoURL: lesson?.videoURL || "",
    videoFile: lesson?.videoFile || "",
    pdfName: lesson?.pdfName || "",
    pdfFile: lesson?.pdfFile || "",
    pdfSizeKB: lesson?.pdfSizeKB || 0,
    description: lesson?.description || "",
  });
  const [uploadName, setUploadName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [pdfError, setPdfError] = useState("");

  function update(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function handleVideoFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError("");

    // MongoDB caps documents at 16 MB and base64 inflates the payload ~33%,
    // so the practical ceiling for an embedded video is ~10 MB.
    // For anything larger the admin should paste a URL instead.
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Video is too large. Max 10 MB for direct upload — use a URL link for larger files.");
      return;
    }

    setUploadName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      update("videoFile", reader.result);
    };
    reader.readAsDataURL(file);
  }

  // Per-lecture PDF — students open it in the secure viewer from the Material
  // tab of the lecture page. Cap matches the course-level Material section.
  function handlePdfFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPdfError("");
    if (file.type !== "application/pdf") {
      setPdfError("Only PDF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfError("PDF is too large. Max 10 MB per lecture.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDraft((d) => ({
        ...d,
        pdfName: file.name,
        pdfFile: reader.result,
        pdfSizeKB: Math.round(file.size / 1024),
      }));
    };
    reader.readAsDataURL(file);
  }

  function clearPdf() {
    setDraft((d) => ({ ...d, pdfName: "", pdfFile: "", pdfSizeKB: 0 }));
    setPdfError("");
  }

  function handleSave() {
    if (!draft.title.trim()) {
      alert("Lecture title is required.");
      return;
    }
    onSave(draft);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#E4E4E4] flex items-center justify-between">
          <h3 className="font-bold text-lg heading-font">Edit Lecture</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#F2F2F2] rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#333333]">Lecture title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#333333]">Type</label>
              <select
                value={draft.type}
                onChange={(e) => update("type", e.target.value)}
                className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
              >
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#333333]">Duration</label>
              <input
                type="text"
                value={draft.duration}
                onChange={(e) => update("duration", e.target.value)}
                placeholder="e.g. 12:45"
                className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
              />
            </div>
          </div>

          {draft.type === "video" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#333333]">Video source</label>
                <div className="flex bg-[#FAFAFA] p-1 rounded-full border border-[#E4E4E4]">
                  <button
                    type="button"
                    onClick={() => update("videoSource", "url")}
                    className={`flex-1 py-2 text-xs font-bold rounded-full transition heading-font ${
                      draft.videoSource === "url"
                        ? "bg-white text-[#D62828] shadow-sm"
                        : "text-[#333333]"
                    }`}
                  >
                    URL link
                  </button>
                  <button
                    type="button"
                    onClick={() => update("videoSource", "upload")}
                    className={`flex-1 py-2 text-xs font-bold rounded-full transition heading-font ${
                      draft.videoSource === "upload"
                        ? "bg-white text-[#D62828] shadow-sm"
                        : "text-[#333333]"
                    }`}
                  >
                    Upload video
                  </button>
                </div>
              </div>

              {draft.videoSource === "url" ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#333333]">
                    Video URL (YouTube, Vimeo, or direct link)
                  </label>
                  <input
                    type="url"
                    value={draft.videoURL}
                    onChange={(e) => update("videoURL", e.target.value)}
                    placeholder="https://…"
                    className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#333333]">
                    Upload video file
                  </label>
                  <label className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-5 cursor-pointer hover:border-[#D62828] transition">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#D62828]">
                        video_file
                      </span>
                      <div className="text-sm">
                        <p className="font-bold">
                          {draft.videoFile ? "Change video" : "Choose video"}
                        </p>
                        <p className="text-xs text-[#666]">
                          {uploadName ||
                            (draft.videoFile
                              ? "Video uploaded — click to replace"
                              : "Max 10 MB · MP4, MOV, WEBM")}
                        </p>
                      </div>
                    </div>
                  </label>
                  {uploadError && (
                    <p className="text-xs text-[#D62828]">{uploadError}</p>
                  )}
                  {draft.videoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        update("videoFile", "");
                        setUploadName("");
                      }}
                      className="text-xs text-[#D62828] font-semibold"
                    >
                      Remove uploaded video
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Optional PDF attached to the lecture itself — opens in the
              secure viewer from the lecture page's Material tab. */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#333333]">
              Lecture PDF (optional)
            </label>
            {draft.pdfFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#E4E4E4] bg-[#FAFAFA] px-4 py-3">
                <span className="material-symbols-outlined text-[#D62828]">
                  picture_as_pdf
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{draft.pdfName || "Lecture PDF"}</p>
                  <p className="text-[11px] text-[#666]">
                    {draft.pdfSizeKB ? `${draft.pdfSizeKB} KB` : "PDF attached"}
                  </p>
                </div>
                <label className="cursor-pointer text-xs font-bold text-[#D62828] hover:bg-[#D62828]/5 px-2.5 py-1.5 rounded">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfFileChange}
                    className="hidden"
                  />
                  Replace
                </label>
                <button
                  type="button"
                  onClick={clearPdf}
                  className="text-xs font-bold text-[#666] hover:text-[#D62828] px-2.5 py-1.5 rounded"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 rounded-lg border-2 border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-4 cursor-pointer hover:border-[#D62828] transition">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileChange}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-[#D62828]">
                  upload_file
                </span>
                <div className="text-sm">
                  <p className="font-bold">Attach PDF to this lecture</p>
                  <p className="text-xs text-[#666]">
                    Max 10 MB. Opens in the secure viewer for students.
                  </p>
                </div>
              </label>
            )}
            {pdfError && <p className="text-xs text-[#D62828]">{pdfError}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#333333]">
              Description (shown on the Overview tab)
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows="3"
              className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828] resize-none"
              placeholder="What students will learn in this lecture…"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E4E4E4] flex items-center justify-end gap-3 bg-[#FAFAFA] rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium text-[#333333] hover:bg-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[#D62828] hover:bg-[#B92323] transition"
          >
            Save lecture
          </button>
        </div>
      </div>
    </div>
  );
}

// Convert a stored ISO string / Date into the "YYYY-MM-DDTHH:MM" format that
// <input type="datetime-local"> requires, in the admin's local timezone.
function toDateTimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ExamSection({ exam, onChange }) {
  const questions = exam.questions || [];

  function patch(fields) {
    onChange({ ...exam, ...fields });
  }

  function addQuestion() {
    patch({
      questions: [
        ...questions,
        // Default new questions to 4 options — admins can add or remove freely.
        { question: "", image: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1 },
      ],
    });
  }

  // Optional image attached to a question (diagram, ECG, scan, etc.). Stored
  // as a base64 data URL alongside the question text — capped at 2 MB so the
  // exam payload stays small.
  function handleQuestionImage(qIndex, file) {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      alert("Only image files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Max 2 MB per question image.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateQuestion(qIndex, { image: reader.result });
    };
    reader.readAsDataURL(file);
  }

  function updateQuestion(index, fields) {
    const next = questions.map((q, i) =>
      i === index ? { ...q, ...fields } : q
    );
    patch({ questions: next });
  }

  function updateOption(qIndex, oIndex, value) {
    const next = questions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...(q.options || [])];
      options[oIndex] = value;
      return { ...q, options };
    });
    patch({ questions: next });
  }

  function addOption(qIndex) {
    const next = questions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...(q.options || [])];
      // Hard cap at 8 options — anything more is unusable in MCQ form.
      if (options.length >= 8) return q;
      options.push("");
      return { ...q, options };
    });
    patch({ questions: next });
  }

  function removeOption(qIndex, oIndex) {
    const next = questions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = (q.options || []).filter((_, idx) => idx !== oIndex);
      // Always keep at least 2 options — MCQ needs a choice.
      if (options.length < 2) return q;

      // If we deleted the correct answer, fall back to the first option.
      // If we deleted one above the correct answer, shift the index down.
      let correctAnswer = q.correctAnswer ?? 0;
      if (oIndex === correctAnswer) correctAnswer = 0;
      else if (oIndex < correctAnswer) correctAnswer -= 1;

      return { ...q, options, correctAnswer };
    });
    patch({ questions: next });
  }

  function deleteQuestion(index) {
    patch({ questions: questions.filter((_, i) => i !== index) });
  }

  return (
    <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 heading-font">
            <span className="material-symbols-outlined text-[#D62828]">
              quiz
            </span>
            Course Exam
          </h2>
          <p className="text-xs text-[#666] mt-1">
            Multiple-choice assessment students take after completing the course.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!exam.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="w-4 h-4 accent-[#D62828]"
          />
          <span className="text-sm font-semibold text-[#333333]">
            Enable exam
          </span>
        </label>
      </div>

      {exam.enabled && (
        <div className="space-y-6">
          {/* Settings row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#333333]">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={exam.durationMinutes || ""}
                onChange={(e) =>
                  patch({ durationMinutes: Number(e.target.value) || 0 })
                }
                className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#333333]">
                Passing score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={exam.passingScore || ""}
                onChange={(e) =>
                  patch({ passingScore: Number(e.target.value) || 0 })
                }
                className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#333333]">
                Allowed attempts
              </label>
              <input
                type="number"
                min="1"
                value={exam.attempts ?? 1}
                onChange={(e) =>
                  patch({ attempts: Math.max(1, Number(e.target.value) || 1) })
                }
                className="w-full bg-[#F7F7F7] border border-[#E4E4E4] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
              />
              <p className="text-[10px] text-[#666]">
                How many times a student can take the exam.
              </p>
            </div>
          </div>

          {/* Anti-cheat */}
          <div className="bg-[#FAFAFA] border border-[#E4E4E4] rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!exam.antiCheat}
                onChange={(e) => patch({ antiCheat: e.target.checked })}
                className="w-4 h-4 mt-0.5 accent-[#D62828]"
              />
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">
                  Anti-cheat (tab-switch detection)
                </p>
                <p className="text-xs text-[#666] mt-0.5">
                  Detects when the student switches tabs / windows or alt-tabs
                  away from the exam page. After the limit is hit, the exam is
                  auto-submitted.
                </p>
              </div>
            </label>

            {exam.antiCheat && (
              <div className="pl-7 flex items-center gap-3">
                <label className="text-xs font-semibold text-[#333333]">
                  Max tab switches:
                </label>
                <input
                  type="number"
                  min="0"
                  value={exam.maxTabSwitches ?? 3}
                  onChange={(e) =>
                    patch({ maxTabSwitches: Number(e.target.value) || 0 })
                  }
                  className="w-24 bg-white border border-[#E4E4E4] rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
                />
              </div>
            )}
          </div>

          {/* Exam behaviour */}
          <div className="bg-[#FAFAFA] border border-[#E4E4E4] rounded-xl p-4 space-y-4">
            <p className="text-sm font-bold text-[#1A1A1A]">Exam behaviour</p>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!exam.allowPrevious}
                onChange={(e) => patch({ allowPrevious: e.target.checked })}
                className="w-4 h-4 mt-0.5 accent-[#D62828]"
              />
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  Allow going back to previous questions
                </p>
                <p className="text-xs text-[#666] mt-0.5">
                  When off, the student moves forward only — no Previous button
                  and the question tracker can't jump back.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!exam.showQuestionMarks}
                onChange={(e) => patch({ showQuestionMarks: e.target.checked })}
                className="w-4 h-4 mt-0.5 accent-[#D62828]"
              />
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  Show marks on each question
                </p>
                <p className="text-xs text-[#666] mt-0.5">
                  Displays the point value of every question to the student
                  while they take the exam.
                </p>
              </div>
            </label>

            <div>
              <p className="text-sm font-semibold text-[#1A1A1A] mb-2">
                Answers review after submission
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: "never", label: "Never" },
                  { value: "immediately", label: "Right away" },
                  { value: "after_date", label: "At a date & time" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                      exam.reviewMode === opt.value
                        ? "border-[#D62828] bg-white"
                        : "border-[#E4E4E4] bg-white/60 hover:border-[#D62828]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exam-review-mode"
                      checked={exam.reviewMode === opt.value}
                      onChange={() => patch({ reviewMode: opt.value })}
                      className="w-4 h-4 accent-[#D62828]"
                    />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </label>
                ))}
              </div>

              {exam.reviewMode === "after_date" && (
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <label className="text-xs font-semibold text-[#333333]">
                    Opens at:
                  </label>
                  <input
                    type="datetime-local"
                    value={toDateTimeLocal(exam.reviewOpensAt)}
                    onChange={(e) =>
                      patch({
                        reviewOpensAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : "",
                      })
                    }
                    className="bg-white border border-[#E4E4E4] rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
                  />
                  <p className="text-[10px] text-[#666] basis-full">
                    Students see "Review unlocks at &lt;date&gt;" until this moment passes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#1A1A1A]">
                Questions ({questions.length})
              </p>
              <button
                type="button"
                onClick={addQuestion}
                className="text-sm font-bold text-[#D62828] flex items-center gap-1 hover:bg-[#D62828]/5 px-3 py-1.5 rounded-lg transition heading-font"
              >
                <span className="material-symbols-outlined text-lg">
                  add_circle
                </span>
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <p className="text-sm text-[#666] italic bg-[#FAFAFA] border border-dashed border-[#D6D6D6] rounded-lg p-6 text-center">
                No questions yet. Click "Add Question" to start building the exam.
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div
                    key={qi}
                    className="bg-[#FAFAFA] border border-[#E4E4E4] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D62828]">
                        Question {qi + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                          Marks
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={q.marks ?? 1}
                          onChange={(e) =>
                            updateQuestion(qi, {
                              marks: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-20 bg-white border border-[#E4E4E4] rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828]"
                        />
                        <button
                          type="button"
                          onClick={() => deleteQuestion(qi)}
                          className="p-1 text-[#666] hover:text-[#D62828] transition"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={q.question}
                      onChange={(e) =>
                        updateQuestion(qi, { question: e.target.value })
                      }
                      placeholder="Question text"
                      rows="2"
                      className="w-full bg-white border border-[#E4E4E4] rounded-lg px-4 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-[#D62828]/15 focus:border-[#D62828] resize-none"
                    />

                    {/* Optional question image — diagrams, ECGs, ultrasound clips. */}
                    <div className="mb-3">
                      {q.image ? (
                        <div className="relative inline-block border border-[#E4E4E4] rounded-lg overflow-hidden bg-white">
                          <img
                            src={q.image}
                            alt="Question reference"
                            className="max-h-44 max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuestion(qi, { image: "" })}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                            title="Remove image"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#D62828] hover:bg-[#D62828]/5 px-3 py-1.5 rounded-lg border border-dashed border-[#D6D6D6]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleQuestionImage(qi, e.target.files?.[0])
                            }
                            className="hidden"
                          />
                          <span className="material-symbols-outlined text-base">
                            add_photo_alternate
                          </span>
                          Add image to question
                        </label>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                        Options · click the radio to mark the correct answer
                      </p>
                      <span className="text-[10px] text-[#666]">
                        {(q.options || []).length} option
                        {(q.options || []).length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(q.options || []).map((opt, oi) => {
                        const canRemove = (q.options || []).length > 2;
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition ${
                              q.correctAnswer === oi
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-[#E4E4E4] bg-white hover:border-[#D62828]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${qi}-correct`}
                              checked={q.correctAnswer === oi}
                              onChange={() =>
                                updateQuestion(qi, { correctAnswer: oi })
                              }
                              className="w-4 h-4 accent-emerald-600 shrink-0"
                            />
                            <span className="text-xs font-bold text-[#666] w-5">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                updateOption(qi, oi, e.target.value)
                              }
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              className="flex-1 bg-transparent outline-none text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(qi, oi)}
                              disabled={!canRemove}
                              title={canRemove ? "Remove option" : "At least 2 options required"}
                              className="p-1 text-[#666] hover:text-[#D62828] transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-base">
                                close
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => addOption(qi)}
                      disabled={(q.options || []).length >= 8}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#D62828] hover:bg-[#D62828]/5 px-3 py-1.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      Add option
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function UploadBox({
  title,
  text,
  icon,
  accept,
  multiple = false,
  onChange,
}) {
  return (
    <label className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-5 cursor-pointer hover:border-[#D62828] hover:bg-white transition-all">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[#D62828] text-[28px]">
          {icon}
        </span>

        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-[#333333]">{text}</p>
        </div>
      </div>
    </label>
  );
}
