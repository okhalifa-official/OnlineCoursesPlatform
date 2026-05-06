import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllNotifications } from "../api/notificationsApi";

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const data = await getAllNotifications();

      const sortedData = [...data].sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotifications(sortedData);
    } catch (error) {
      alert(error.message);
      console.error("Notifications error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadNotifications();

    const intervalId = setInterval(function () {
      loadNotifications();
    }, 5000);

    return function () {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] p-8">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[#333333]/70 heading-font mb-2">
            Admin Notifications
          </p>

          <h1 className="text-4xl font-extrabold heading-font">
            All Notifications
          </h1>

          <p className="text-[#333333]/70 mt-2">
            Latest system updates, users, courses, approvals, and drafts.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadNotifications}
            className="rounded-xl bg-[#D62828] text-white px-5 py-3 text-sm font-bold heading-font"
          >
            Refresh
          </button>

          <Link
            to="/dashboard"
            className="rounded-xl bg-[#1A1A1A] text-white px-5 py-3 text-sm font-bold heading-font"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <section className="rounded-3xl bg-white shadow-card card-border overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E5E5E5]">
          <h2 className="text-xl font-bold heading-font">
            Notifications List
          </h2>

          <p className="text-sm text-[#333333]/70 mt-1">
            Total notifications: {notifications.length}
          </p>
        </div>

        <div className="divide-y divide-[#eee]">
          {loading && (
            <div className="px-6 py-10 text-center text-[#333333]/70">
              Loading notifications...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="px-6 py-10 text-center text-[#333333]/70">
              No notifications found.
            </div>
          )}

          {!loading &&
            notifications.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="flex items-center justify-between gap-5 px-6 py-5 hover:bg-[#fafafa] transition"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">
                      {item.icon}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-bold heading-font">
                      {item.title}
                    </p>

                    <p className="text-sm text-[#333333]/70 mt-1">
                      {item.description}
                    </p>

                    <p className="text-xs text-[#333333]/50 mt-2 capitalize">
                      Type: {item.type}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-[#333333]/70">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}