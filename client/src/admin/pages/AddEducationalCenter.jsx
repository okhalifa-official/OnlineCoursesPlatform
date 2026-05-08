import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EducationalCenterForm, {
  emptyCenter,
} from "../components/EducationalCenterForm";
import { createEducationalCenter } from "../api/educationalCentersApi";

export default function AddEducationalCenter() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyCenter);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await createEducationalCenter(cleanCenterData(formData));

      navigate("/educational-centers");
    } catch (error) {
      alert(error.message);
      console.error("Create center error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <EducationalCenterForm
      mode="add"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}

function cleanCenterData(data) {
  return {
    ...data,
    studentCapacity: Number(data.studentCapacity || 0),
    activeStudents: Number(data.activeStudents || 0),
    coursesCapacity: Number(data.coursesCapacity || 0),
    activeCourses: Number(data.activeCourses || 0),
    classrooms: Number(data.classrooms || 0),
    certificationRate: Number(data.certificationRate || 0),
  };
}