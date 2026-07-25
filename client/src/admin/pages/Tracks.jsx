// client/src/admin/pages/Tracks.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTrack, getTracks } from "../api/tracksApi";

export default function Tracks() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const data = await getTracks();

      setTracks(data);
    } catch (error) {
      alert(error.message);
      console.error("Load tracks error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadData();
  }, []);

  async function handleDelete(track) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${track.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteTrack(track._id);
      await loadData();
    } catch (error) {
      alert(error.message);
      console.error("Delete track error:", error.message);
    }
  }

  const filteredTracks = tracks.filter((track) =>
    track.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold heading-font">Tracks</h1>

            <p className="muted-text mt-2 max-w-2xl">
              Manage the course tracks shown on the home page and used to
              categorize every course.
            </p>
          </div>

          <Link
            to="/tracks/add"
            className="px-5 py-3 bg-brandRed text-white rounded-xl font-bold heading-font flex items-center gap-2 hover:opacity-90 transition"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Track
          </Link>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-charcoal placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-card">
            <p className="font-bold text-charcoal">Loading tracks...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-card p-12 text-center">
            <p className="heading-font text-2xl font-bold text-charcoal mb-2">
              No tracks found
            </p>
            <p className="text-sm muted-text">
              {tracks.length === 0
                ? "Add your first track to get started."
                : "Change the search and try again."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map((track) => (
              <div
                key={track._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ background: track.color }}
                  />
                  <h3 className="text-lg heading-font font-bold text-charcoal">
                    {track.name}
                  </h3>
                </div>

                {track.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {track.description}
                  </p>
                )}

                <p className="text-xs text-gray-400 mb-4">
                  {track.courseCount}{" "}
                  {track.courseCount === 1 ? "course" : "courses"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Link
                    to={`/tracks/edit/${track._id}`}
                    className="w-9 h-9 rounded-lg bg-softGrey flex items-center justify-center text-charcoal hover:bg-brandRed hover:text-white transition"
                  >
                    <span className="material-symbols-outlined text-lg">
                      edit
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(track)}
                    className="w-9 h-9 rounded-lg bg-softGrey flex items-center justify-center text-brandRed hover:bg-brandRed hover:text-white transition"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
