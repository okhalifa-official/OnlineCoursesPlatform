import { Link } from "react-router-dom";

export const emptyCourse = {
  courseName: "",
  courseDescription: "",
  coursePrice: "",
  publishStatus: "Draft",
  previewImage: "",
  previewVideoName: "",
  courseFilesNames: [],
  lessonAssetsNames: [],
  modules: [
    {
      title: "Foundations of Design Theory",
      lessons: [
        {
          title: "1.1 Introduction to Spatial Awareness",
          type: "video",
          duration: "12:45",
        },
        {
          title: "1.2 Historical Context PDF Guide",
          type: "pdf",
          duration: "4.2 MB",
        },
      ],
    },
  ],
};

export default function CourseForm({
  mode = "add",
  formData,
  setFormData,
  onSubmit,
  saving,
}) {
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

  function handlePreviewVideoChange(e) {
    const file = e.target.files[0];

    setFormData({
      ...formData,
      previewVideoName: file ? file.name : "",
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

  function addModule() {
    const newModuleNumber = String(formData.modules.length + 1).padStart(2, "0");

    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
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
    updatedModules[moduleIndex].title = newTitle.trim();

    setFormData({
      ...formData,
      modules: updatedModules,
    });
  }

  function deleteModule(moduleIndex) {
    if (formData.modules.length === 1) {
      alert("At least one module should remain");
      return;
    }

    const updatedModules = formData.modules.filter(
      (_, index) => index !== moduleIndex
    );

    setFormData({
      ...formData,
      modules: updatedModules,
    });
  }

  function addLesson(moduleIndex) {
    const lessonTitle = window.prompt("Lesson title", "New Lesson");

    if (!lessonTitle || !lessonTitle.trim()) return;

    const updatedModules = [...formData.modules];

    updatedModules[moduleIndex].lessons.push({
      title: lessonTitle.trim(),
      type: "video",
      duration: "00:00",
    });

    setFormData({
      ...formData,
      modules: updatedModules,
    });
  }

  function editLesson(moduleIndex, lessonIndex) {
    const lesson = formData.modules[moduleIndex].lessons[lessonIndex];

    const newTitle = window.prompt("Edit lesson name", lesson.title);

    if (!newTitle || !newTitle.trim()) return;

    const updatedModules = [...formData.modules];
    updatedModules[moduleIndex].lessons[lessonIndex].title = newTitle.trim();

    setFormData({
      ...formData,
      modules: updatedModules,
    });
  }

  function deleteLesson(moduleIndex, lessonIndex) {
    const updatedModules = [...formData.modules];

    updatedModules[moduleIndex].lessons = updatedModules[
      moduleIndex
    ].lessons.filter((_, index) => index !== lessonIndex);

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
            to="/courses"
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
                type="button"
                onClick={() => setStatus("Draft")}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium text-[#D62828] hover:bg-white transition-all"
              >
                Save Draft
              </button>

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

                  <div className="bg-[#F7F7F7] rounded-lg overflow-hidden border border-[#E4E4E4]">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E4E4E4] bg-[#FAFAFA]">
                      <button type="button" className="p-1.5 hover:bg-white rounded">
                        <span className="material-symbols-outlined text-sm">
                          format_bold
                        </span>
                      </button>
                      <button type="button" className="p-1.5 hover:bg-white rounded">
                        <span className="material-symbols-outlined text-sm">
                          format_italic
                        </span>
                      </button>
                      <button type="button" className="p-1.5 hover:bg-white rounded">
                        <span className="material-symbols-outlined text-sm">
                          format_list_bulleted
                        </span>
                      </button>
                      <button type="button" className="p-1.5 hover:bg-white rounded">
                        <span className="material-symbols-outlined text-sm">
                          link
                        </span>
                      </button>
                    </div>

                    <textarea
                      name="courseDescription"
                      value={formData.courseDescription}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 focus:ring-0 px-4 py-3 resize-none outline-none"
                      placeholder="Provide a detailed overview of what students will achieve..."
                      rows="6"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

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
                {formData.modules.map((module, moduleIndex) => (
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
                      {module.lessons.map((lesson, lessonIndex) => (
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
                        Add Lesson
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-8">
            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 heading-font">
                <span className="material-symbols-outlined text-[#D62828]">
                  image
                </span>
                Visual Identity
              </h2>

              <label className="relative group cursor-pointer overflow-hidden rounded-lg aspect-video bg-[#FAFAFA] border-2 border-dashed border-[#D6D6D6] flex flex-col items-center justify-center hover:bg-[#F5F5F5] transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePreviewImageChange}
                  className="hidden"
                />

                {formData.previewImage ? (
                  <img
                    src={formData.previewImage}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="material-symbols-outlined text-[#D62828] text-3xl mb-2">
                      upload_file
                    </span>
                    <p className="text-sm font-bold">Upload Preview Image</p>
                    <p className="text-xs text-[#333333] mt-1">
                      16:9 ratio recommended
                    </p>
                  </div>
                )}
              </label>
            </section>

            <section className="bg-white rounded-xl p-8 shadow-card border border-[#E4E4E4]">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 heading-font">
                <span className="material-symbols-outlined text-[#D62828]">
                  folder_managed
                </span>
                Course Media & Files
              </h2>

              <div className="space-y-4">
                <UploadBox
                  title="Upload Preview Video"
                  text={formData.previewVideoName || "MP4, MOV, WEBM"}
                  icon="video_file"
                  accept="video/*"
                  onChange={handlePreviewVideoChange}
                />

                <UploadBox
                  title="Upload Course Files"
                  text={
                    formData.courseFilesNames.length > 0
                      ? `${formData.courseFilesNames.length} file(s) selected`
                      : "PDF, DOCX, PPTX, ZIP"
                  }
                  icon="upload_file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                  multiple
                  onChange={handleCourseFilesChange}
                />

                <UploadBox
                  title="Upload Lesson Assets"
                  text={
                    formData.lessonAssetsNames.length > 0
                      ? `${formData.lessonAssetsNames.length} asset(s) selected`
                      : "Videos, audio, notes, attachments"
                  }
                  icon="perm_media"
                  accept="video/*,audio/*,.pdf,.doc,.docx,.zip"
                  multiple
                  onChange={handleLessonAssetsChange}
                />
              </div>
            </section>

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

        <div className="mt-12 pt-8 border-t border-[#E4E4E4] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-[#333333]">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#F2F2F2] bg-slate-200"></div>
              <div className="w-8 h-8 rounded-full border-2 border-[#F2F2F2] bg-slate-300"></div>
              <div className="w-8 h-8 rounded-full border-2 border-[#F2F2F2] bg-slate-400"></div>
            </div>
            <span className="text-xs font-medium italic">
              Shared with 3 co-instructors
            </span>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 md:flex-none px-10 py-4 rounded-lg font-bold text-white bg-[#D62828] hover:bg-[#B92323] transition-all active:scale-95 duration-100 shadow-xl shadow-[#D62828]/20 heading-font disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : mode === "add"
                ? "Create Course"
                : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </main>
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