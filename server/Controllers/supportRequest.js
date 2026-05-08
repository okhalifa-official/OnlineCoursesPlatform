const SupportRequest = require("../Models/SupportRequest");
const SystemLog = require("../Models/SystemLog");
const sendEmail = require("../utils/sendEmail");

async function logSupportAction(data) {
  try {
    await SystemLog.create(data);
  } catch (error) {
    console.error("Support log error:", error.message);
  }
}

function buildSupportEmailHtml(supportRequest) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f2f2f2; padding:24px;">
      <div style="max-width:700px; margin:auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5e5e5;">
        <div style="background:#D62828; color:#ffffff; padding:24px;">
          <h2 style="margin:0; font-size:24px;">New Support Request</h2>
          <p style="margin:8px 0 0; font-size:14px;">
            A new issue has been submitted from the admin help page.
          </p>
        </div>

        <div style="padding:24px;">
          <table style="width:100%; border-collapse:collapse; font-size:15px;">
            <tr>
              <td style="padding:10px 0; font-weight:bold; width:160px;">Name</td>
              <td style="padding:10px 0;">${supportRequest.name}</td>
            </tr>

            <tr>
              <td style="padding:10px 0; font-weight:bold;">Email</td>
              <td style="padding:10px 0;">${supportRequest.email}</td>
            </tr>

            <tr>
              <td style="padding:10px 0; font-weight:bold;">Page Name</td>
              <td style="padding:10px 0;">${supportRequest.pageName}</td>
            </tr>

            <tr>
              <td style="padding:10px 0; font-weight:bold;">Issue Type</td>
              <td style="padding:10px 0;">${supportRequest.issueType}</td>
            </tr>

            <tr>
              <td style="padding:10px 0; font-weight:bold;">Priority</td>
              <td style="padding:10px 0;">${supportRequest.priority}</td>
            </tr>

            <tr>
              <td style="padding:10px 0; font-weight:bold;">Status</td>
              <td style="padding:10px 0;">${supportRequest.status}</td>
            </tr>

            <tr>
              <td style="padding:10px 0; font-weight:bold;">Created At</td>
              <td style="padding:10px 0;">${new Date(supportRequest.createdAt).toLocaleString()}</td>
            </tr>
          </table>

          <div style="margin-top:24px;">
            <p style="font-weight:bold; margin-bottom:8px;">Message</p>
            <div style="background:#f8f8f8; border:1px solid #e5e5e5; border-radius:12px; padding:16px; line-height:1.7;">
              ${String(supportRequest.message).replace(/\n/g, "<br />")}
            </div>
          </div>
        </div>

        <div style="padding:16px 24px; background:#fafafa; color:#777; font-size:12px;">
          Sono School Support Request
        </div>
      </div>
    </div>
  `;
}

const createSupportRequest = async function (req, res) {
  try {
    const { name, email, pageName, issueType, priority, message } = req.body;

    if (!name || !email || !pageName || !message) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const supportRequest = await SupportRequest.create({
      name,
      email,
      pageName,
      issueType: issueType || "Technical",
      priority: priority || "Medium",
      message,
      status: "Open",
    });

    await logSupportAction({
      action: "Support Request Created",
      module: "Support",
      description: `${name} submitted a support request from ${pageName}`,
      status: "Success",
      statusCode: 201,
      actorName: name,
    });

    let emailSent = false;
    let emailError = "";

    try {
      await sendEmail({
        to: process.env.SUPPORT_TO_EMAIL || process.env.SMTP_USER,
        subject: `New Support Request - ${pageName}`,
        html: buildSupportEmailHtml(supportRequest),
      });

      emailSent = true;
    } catch (error) {
      emailSent = false;
      emailError = error.message;
      console.error("Support email error:", error.message);
    }

    return res.status(201).json({
      message: emailSent
        ? "Support request saved and email sent successfully"
        : "Support request saved, but email was not sent",
      emailSent,
      emailError,
      supportRequest,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create support request",
      error: error.message,
    });
  }
};

const getSupportRequests = async function (req, res) {
  try {
    const { search, status, issueType } = req.query;

    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (issueType && issueType !== "All") {
      filter.issueType = issueType;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { pageName: { $regex: search, $options: "i" } },
        { issueType: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const supportRequests = await SupportRequest.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json(supportRequests);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load support requests",
      error: error.message,
    });
  }
};

const updateSupportRequest = async function (req, res) {
  try {
    const { status, priority } = req.body;

    const updateData = {};

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const supportRequest = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!supportRequest) {
      return res.status(404).json({
        message: "Support request not found",
      });
    }

    await logSupportAction({
      action: "Support Request Updated",
      module: "Support",
      description: `Support request updated to ${supportRequest.status}`,
      status: "Success",
      statusCode: 200,
      actorName: "Admin",
    });

    return res.status(200).json({
      message: "Support request updated successfully",
      supportRequest,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update support request",
      error: error.message,
    });
  }
};

const deleteSupportRequest = async function (req, res) {
  try {
    const supportRequest = await SupportRequest.findByIdAndDelete(req.params.id);

    if (!supportRequest) {
      return res.status(404).json({
        message: "Support request not found",
      });
    }

    await logSupportAction({
      action: "Support Request Deleted",
      module: "Support",
      description: `Support request from ${supportRequest.name} was deleted`,
      status: "Success",
      statusCode: 200,
      actorName: "Admin",
    });

    return res.status(200).json({
      message: "Support request deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete support request",
      error: error.message,
    });
  }
};

module.exports = {
  createSupportRequest,
  getSupportRequests,
  updateSupportRequest,
  deleteSupportRequest,
};