import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEducationalCenterById } from "../api/educationalCentersApi";

export default function EducationalCenterProfile() {
  const { id } = useParams();
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    function () {
      async function loadCenter() {
        try {
          const data = await getEducationalCenterById(id);
          setCenter(data);
        } catch (error) {
          alert(error.message);
          console.error("Load center profile error:", error.message);
        } finally {
          setLoading(false);
        }
      }

      loadCenter();
    },
    [id]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-softGrey flex items-center justify-center">
        <p className="font-bold text-charcoal">Loading center profile...</p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-softGrey flex items-center justify-center">
        <p className="font-bold text-charcoal">Center not found</p>
      </div>
    );
  }

  const image =
    center.imageUrl ||
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-softGrey text-charcoal p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold heading-font">
              Center Profile
            </h1>

            <p className="muted-text mt-2">
              Full operational and academic details for this center.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/educational-centers/edit/${center._id}`}
              className="px-5 py-3 bg-brandRed text-white rounded-xl heading-font font-bold hover:opacity-90 transition"
            >
              Edit Center
            </Link>

            <Link
              to="/educational-centers"
              className="px-5 py-3 bg-white text-charcoal border border-gray-200 rounded-xl heading-font font-bold hover:bg-softGrey transition"
            >
              Back
            </Link>
          </div>
        </header>

        <main className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="h-64 relative">
              <img
                src={image}
                className="w-full h-full object-cover"
                alt={center.name}
              />

              <div className="absolute top-4 right-4 px-3 py-1 bg-brandRed text-white text-[10px] heading-font font-bold uppercase rounded-full">
                {center.status}
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-3xl heading-font font-extrabold text-charcoal mb-2">
                {center.name}
              </h2>

              <div className="flex items-center gap-2 text-charcoal mb-6">
                <span className="material-symbols-outlined text-sm">
                  location_on
                </span>

                <span className="text-sm">
                  {[center.city, center.country].filter(Boolean).join(", ") ||
                    "-"}
                </span>
              </div>

              <div className="space-y-4">
                <InfoBox label="Manager" value={center.assignedManager} />
                <InfoBox label="Operating Model" value={center.operatingModel} />
                <InfoBox
                  label="Contact"
                  value={
                    <>
                      <p>{center.phone || "-"}</p>
                      <p className="text-sm muted-text">{center.email || "-"}</p>
                    </>
                  }
                />
              </div>
            </div>
          </section>

          <section className="xl:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
              <h2 className="text-2xl heading-font font-bold mb-6">
                Center Overview
              </h2>

              <p className="muted-text leading-7">
                {center.description || "No description available."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Metric label="Students" value={center.activeStudents} />
              <Metric label="Courses" value={center.activeCourses} />
              <Metric label="Classrooms" value={center.classrooms} />
              <Metric
                label="Certification"
                value={`${center.certificationRate || 0}%`}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
              <h2 className="text-2xl heading-font font-bold mb-6">
                Center Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Detail label="Center Code" value={center.centerCode} />
                <Detail label="Status" value={center.status} />
                <Detail label="Opening Date" value={formatDate(center.openingDate)} />
                <Detail label="Country" value={center.country} />
                <Detail label="City" value={center.city} />
                <Detail label="Address" value={center.address} />
                <Detail label="Student Capacity" value={center.studentCapacity} />
                <Detail label="Courses Capacity" value={center.coursesCapacity} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-softGrey p-4">
      <p className="text-xs heading-font font-bold uppercase text-charcoal mb-1">
        {label}
      </p>

      <div className="font-semibold text-charcoal">{value || "-"}</div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
      <p className="text-xs heading-font font-bold uppercase tracking-widest text-brandRed mb-2">
        {label}
      </p>

      <p className="text-4xl heading-font font-extrabold">
        {Number(value || 0).toLocaleString()}
      </p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-softGrey px-4 py-3">
      <p className="text-xs heading-font font-bold uppercase text-charcoal/70 mb-1">
        {label}
      </p>

      <p className="font-semibold text-charcoal">{value || "-"}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString();
}