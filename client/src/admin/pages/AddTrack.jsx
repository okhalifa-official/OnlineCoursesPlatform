import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TrackForm, { emptyTrack } from "../components/TrackForm";
import { createTrack } from "../api/tracksApi";

export default function AddTrack() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyTrack);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await createTrack(formData);

      navigate("/tracks");
    } catch (error) {
      alert(error.message);
      console.error("Create track error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TrackForm
      mode="add"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}
