const Notification = require("../Models/notification");

async function createNotification({ userId, type, title, body, link, metadata }) {
  try {
    return await Notification.create({
      userId,
      type: type || "info",
      title: String(title || "").slice(0, 200),
      body: String(body || "").slice(0, 500),
      link: link || "",
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("createNotification failed:", error.message);
    return null;
  }
}

const listMyNotifications = async function (req, res) {
  try {
    const items = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return res.status(200).json({ items, unreadCount });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load notifications", error: error.message });
  }
};

const markAllRead = async function (req, res) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark notifications read", error: error.message });
  }
};

const markOneRead = async function (req, res) {
  try {
    await Notification.updateOne(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } }
    );
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark notification read", error: error.message });
  }
};

module.exports = {
  createNotification,
  listMyNotifications,
  markAllRead,
  markOneRead,
};
