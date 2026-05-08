import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EducationalCenterForm, {
  emptyCenter,
} from "../components/EducationalCenterForm";
import {
  getEducationalCenterById,
  updateEducationalCenter,
} from "../api/educationalCentersApi";

export default function EditEducationalCenter() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyCenter);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(
    function () {
      async function loadCenter() {
        try {
          const data = await getEducationalCenterById(id);

          setFormData({
            ...emptyCenter,
            ...data,
            openingDate: data.openingDate ? data.openingDate.slice(0, 10) : "",
          });
        } catch (error) {
          alert(error.message);
          console.error("Load center error:", error.message);
        } finally {
          setPageLoading(false);
        }
      }

      loadCenter();
    },
    [id]
  );

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await updateEducationalCenter(id, cleanCenterData(formData));

      navigate("/educational-centers");
    } catch (error) {
      alert(error.message);
      console.error("Update center error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-softGrey flex items-center justify-center">
        <p className="font-bold text-charcoal">Loading center...</p>
      </div>
    );
  }

  return (
    <EducationalCenterForm
      mode="edit"
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