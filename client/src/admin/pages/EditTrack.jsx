import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TrackForm, { emptyTrack } from "../components/TrackForm";
import { getTracks, updateTrack } from "../api/tracksApi";

export default function EditTrack() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyTrack);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(
    function () {
      async function loadTrack() {
        try {
          const tracks = await getTracks();
          const track = tracks.find((t) => t._id === id);

          if (!track) {
            throw new Error("Track not found");
          }

          setFormData({
            name: track.name,
            description: track.description || "",
            color: track.color || "#D62828",
          });
        } catch (error) {
          alert(error.message);
          console.error("Load track error:", error.message);
        } finally {
          setPageLoading(false);
        }
      }

      loadTrack();
    },
    [id]
  );

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await updateTrack(id, formData);

      navigate("/tracks");
    } catch (error) {
      alert(error.message);
      console.error("Update track error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-softGrey flex items-center justify-center">
        <p className="font-bold text-charcoal">Loading track...</p>
      </div>
    );
  }

  return (
    <TrackForm
      mode="edit"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}
