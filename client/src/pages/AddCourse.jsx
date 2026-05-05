import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseForm, { emptyCourse } from "../components/CourseForm";
import { createCourse } from "../api/coursesApi";

export default function AddCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyCourse);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await createCourse({
        ...formData,
        coursePrice: Number(formData.coursePrice),
      });

      alert("Course created successfully");
      navigate("/courses");
    } catch (error) {
      alert(error.message);
      console.error("Create course error:", error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CourseForm
      mode="add"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      saving={saving}
    />
  );
}