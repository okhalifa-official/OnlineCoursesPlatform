const User = require("../Models/user");
const SystemLog = require("../Models/SystemLog");

const defaultPermissions = {
  viewEnrolledCourses: true,
  downloadResources: true,
  takeQuizzes: true,
  submitAssignments: true,
  joinDiscussions: true,
  viewCertificates: true,
  accessLiveSessions: true,
  sendMessages: false,
  defaultAccessNote:
    "Students can only access the courses they are enrolled in and complete platform learning activities based on course availability.",
};

async function createLog(data) {
  try {
    await SystemLog.create(data);
  } catch (error) {
    console.error("Student permissions log error:", error.message);
  }
}

const getStudentPermissions = async function (req, res) {
  try {
    const student = await User.findById(req.params.id).select(
      "name fullName username email role studentPermissions"
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.status(200).json({
      student: {
        _id: student._id,
        name: student.name || student.fullName || student.username || "Student",
        email: student.email || "",
        role: student.role || "student",
      },
      permissions: {
        ...defaultPermissions,
        ...(student.studentPermissions || {}),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get student permissions",
      error: error.message,
    });
  }
};

const updateStudentPermissions = async function (req, res) {
  try {
    const {
      viewEnrolledCourses,
      downloadResources,
      takeQuizzes,
      submitAssignments,
      joinDiscussions,
      viewCertificates,
      accessLiveSessions,
      sendMessages,
      defaultAccessNote,
    } = req.body;

    const updateData = {
      studentPermissions: {
        viewEnrolledCourses: Boolean(viewEnrolledCourses),
        downloadResources: Boolean(downloadResources),
        takeQuizzes: Boolean(takeQuizzes),
        submitAssignments: Boolean(submitAssignments),
        joinDiscussions: Boolean(joinDiscussions),
        viewCertificates: Boolean(viewCertificates),
        accessLiveSessions: Boolean(accessLiveSessions),
        sendMessages: Boolean(sendMessages),
        defaultAccessNote:
          defaultAccessNote ||
          defaultPermissions.defaultAccessNote,
      },
    };

    const student = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("name fullName username email role studentPermissions");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    await createLog({
      action: "Student Permissions Updated",
      module: "Users",
      description: `Permissions updated for ${
        student.name || student.fullName || student.username || student.email
      }`,
      status: "Success",
      statusCode: 200,
      actorName: "Admin",
    });

    return res.status(200).json({
      message: "Student permissions updated successfully",
      student: {
        _id: student._id,
        name: student.name || student.fullName || student.username || "Student",
        email: student.email || "",
        role: student.role || "student",
      },
      permissions: student.studentPermissions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update student permissions",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentPermissions,
  updateStudentPermissions,
};