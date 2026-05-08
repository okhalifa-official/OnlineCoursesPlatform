const Announcement = require("../Models/Announcement");
const User = require("../Models/user");
const SystemLog = require("../Models/SystemLog");
const sendEmail = require("../utils/sendEmail");

function getUserName(user) {
  return (
    user.fullName ||
    user.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.username ||
    "User"
  );
}

function getCurrentUser(req) {
  return req.user || req.admin || req.auth || {};
}

function buildAudienceFilter({ audienceType, center, course }) {
  const filter = {};

  if (audienceType === "students") {
    filter.role = "student";
  }

  if (audienceType === "instructors") {
    filter.role = "instructor";
  }

  if (audienceType === "admins") {
    filter.role = "admin";
  }

  if (center && center !== "all") {
    filter.$or = [
      { educationalCenter: center },
      { center: center },
      { assignedCenter: center },
    ];
  }

  if (course && course !== "all") {
    filter.registeredCourses = course;
  }

  return filter;
}

function buildEmailHtml({ subject, body, priority }) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f2f2f2; padding:24px;">
      <div style="max-width:700px; margin:auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5e5e5;">
        <div style="background:#D62828; color:#ffffff; padding:24px;">
          <h2 style="margin:0; font-size:24px;">${subject}</h2>
          <p style="margin:8px 0 0; font-size:13px; text-transform:uppercase;">
            Priority: ${priority}
          </p>
        </div>

        <div style="padding:24px; color:#1A1A1A; line-height:1.7; font-size:15px;">
          ${String(body).replace(/\n/g, "<br />")}
        </div>

        <div style="padding:16px 24px; background:#fafafa; color:#777; font-size:12px;">
          Sono School Platform Announcement
        </div>
      </div>
    </div>
  `;
}

async function createSystemLog(data) {
  try {
    await SystemLog.create(data);
  } catch (error) {
    console.error("Announcement log error:", error.message);
  }
}

const getAnnouncementMeta = async function (req, res) {
  try {
    const users = await User.find().select(
      "educationalCenter center assignedCenter registeredCourses"
    );

    const centersSet = new Set();
    const coursesSet = new Set();

    users.forEach((user) => {
      if (user.educationalCenter) centersSet.add(user.educationalCenter);
      if (user.center) centersSet.add(user.center);
      if (user.assignedCenter) centersSet.add(user.assignedCenter);

      if (Array.isArray(user.registeredCourses)) {
        user.registeredCourses.forEach((course) => {
          if (course) coursesSet.add(course);
        });
      }
    });

    return res.status(200).json({
      centers: [...centersSet],
      courses: [...coursesSet],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load announcement meta",
      error: error.message,
    });
  }
};

const getAnnouncements = async function (req, res) {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(announcements);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load announcements",
      error: error.message,
    });
  }
};

const createAnnouncement = async function (req, res) {
  try {
    const {
      subject,
      body,
      audienceType,
      center,
      course,
      deliveryMethod,
      priority,
      scheduleType,
      scheduledAt,
    } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        message: "Subject and message body are required",
      });
    }

    const filter = buildAudienceFilter({
      audienceType: audienceType || "all",
      center: center || "all",
      course: course || "all",
    });

    const users = await User.find(filter).select(
      "firstName lastName fullName name username email role"
    );

    if (users.length === 0) {
      return res.status(400).json({
        message: "No users match the selected audience",
      });
    }

    const currentUser = getCurrentUser(req);
    const isScheduled = scheduleType === "schedule_later";
    const shouldSendEmail =
      deliveryMethod === "email" || deliveryMethod === "both";

    const announcement = await Announcement.create({
      subject,
      body,
      audienceType: audienceType || "all",
      center: center || "all",
      course: course || "all",
      deliveryMethod: deliveryMethod || "in_app",
      priority: priority || "normal",
      scheduleType: scheduleType || "send_now",
      scheduledAt: isScheduled ? scheduledAt || null : null,
      status: isScheduled ? "scheduled" : "sent",
      totalRecipients: users.length,
      successfulEmails: 0,
      failedEmails: 0,
      recipients: users.map((user) => ({
        user: user._id,
        name: getUserName(user),
        email: user.email || "",
        role: user.role || "",
        deliveryStatus: shouldSendEmail && !isScheduled ? "pending" : "skipped",
        error: "",
      })),
      createdBy: currentUser._id || currentUser.id || null,
      createdByName:
        currentUser.fullName ||
        currentUser.name ||
        currentUser.username ||
        "Admin",
      sentAt: isScheduled ? null : new Date(),
    });

    if (isScheduled) {
      await createSystemLog({
        action: "Announcement Scheduled",
        module: "Announcements",
        description: `Announcement scheduled to ${users.length} user(s): ${subject}`,
        status: "Success",
        statusCode: 201,
        actorName: announcement.createdByName,
      });

      return res.status(201).json({
        message: "Announcement scheduled successfully",
        announcement,
      });
    }

    let successfulEmails = 0;
    let failedEmails = 0;

    if (shouldSendEmail) {
      for (let i = 0; i < announcement.recipients.length; i += 1) {
        const recipient = announcement.recipients[i];

        if (!recipient.email) {
          failedEmails += 1;
          recipient.deliveryStatus = "failed";
          recipient.error = "Missing email";
          continue;
        }

        try {
          await sendEmail({
            to: recipient.email,
            subject,
            html: buildEmailHtml({
              subject,
              body,
              priority: priority || "normal",
            }),
          });

          successfulEmails += 1;
          recipient.deliveryStatus = "sent";
          recipient.error = "";
        } catch (emailError) {
          failedEmails += 1;
          recipient.deliveryStatus = "failed";
          recipient.error = emailError.message;
        }
      }
    }

    announcement.successfulEmails = successfulEmails;
    announcement.failedEmails = failedEmails;

    await announcement.save();

    await createSystemLog({
      action: "Bulk Announcement Sent",
      module: "Announcements",
      description: `Announcement sent to ${users.length} user(s): ${subject}`,
      status: "Success",
      statusCode: 201,
      actorName: announcement.createdByName,
    });

    return res.status(201).json({
      message: shouldSendEmail
        ? `Announcement saved. Emails sent: ${successfulEmails}, failed: ${failedEmails}`
        : "Announcement saved successfully",
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send announcement",
      error: error.message,
    });
  }
};

const deleteAnnouncement = async function (req, res) {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};

module.exports = {
  getAnnouncementMeta,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};