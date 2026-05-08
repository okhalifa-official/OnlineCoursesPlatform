import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLatestNotifications } from "../api/notificationsApi";

function formatTimeAgo(date) {
  if (!date) return "";

  const createdDate = new Date(date);
  const now = new Date();

  const diffMs = now - createdDate;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} day ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  async function loadNotifications() {
    try {
      const data = await getLatestNotifications();

      const sortedData = [...data].sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotifications(sortedData);
    } catch (error) {
      console.error("Notifications error:", error.message);
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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-12 w-12 rounded-full bg-[#F2F2F2] text-[#1A1A1A] hover:bg-[#e8e8e8] transition flex items-center justify-center"
        type="button"
      >
        <span className="material-symbols-outlined">notifications</span>

        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#D62828] border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[56px] w-[380px] bg-white rounded-2xl border border-[#E5E5E5] shadow-[0_12px_35px_rgba(0,0,0,0.12)] overflow-hidden z-[100]">
          <div className="px-5 py-4 border-b border-[#EEEEEE] bg-[#fafafa]">
            <h3 className="text-[16px] font-bold text-[#1A1A1A] heading-font">
              Notifications
            </h3>

            <p className="text-[12px] text-[#666]">
              {notifications.length === 0
                ? "No unread notifications"
                : `You have ${notifications.length} recent notification(s)`}
            </p>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[#333333]/70">
                No notifications right now.
              </div>
            )}

            {notifications.map((item) => (
              <Link
                to={item.link}
                key={item.id}
                onClick={() => setIsOpen(false)}
                className="flex gap-3 px-5 py-4 border-b border-[#F1F1F1] hover:bg-[#fafafa] transition"
              >
                <div className="h-10 w-10 rounded-full bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold heading-font text-[#1A1A1A]">
                    {item.title}
                  </p>

                  <p className="text-xs text-[#333333]/70 mt-1">
                    {item.description}
                  </p>

                  <p className="text-[11px] text-[#333333]/50 mt-2">
                    {formatTimeAgo(item.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-[#EEEEEE] bg-[#fafafa]">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="w-full h-10 rounded-xl bg-[#D62828] text-white text-sm font-bold heading-font flex items-center justify-center hover:opacity-95 transition"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}