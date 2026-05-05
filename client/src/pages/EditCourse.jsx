import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CourseForm, { emptyCourse } from "../components/CourseForm";
import { getCourseById, updateCourse } from "../api/coursesApi";

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyCourse);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(
    function () {
      async function loadCourse() {
        try {
          const data = await getCourseById(id);

          setFormData({
            ...emptyCourse,
            ...data,
            coursePrice: String(data.coursePrice),
          });
        } catch (error) {
          alert(error.message);
          console.error("Load course error:", error.message);
        } finally {
          setLoading(false);
        }
      }

      loadCourse();
    },
    [id]
  );

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const dataToSend = {
        ...formData,
        coursePrice: Number(formData.coursePrice),
      };

      delete dataToSend._id;
      delete dataToSend.createdAt;
      delete dataToSend.updatedAt;
      delete dataToSend.__v;

      await updateCourse(id, dataToSend);

      alert("Course updated successfully");
      navigate("/courses");
    } catch (error) {
      alert(error.message);
      console.error("Update course error:", error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="font-bold text-[#1A1A1A]">Loading course...</p>
      </main>
    );
  }

  return (
    <CourseForm
      mode="edit"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      saving={saving}
    />
  );
}