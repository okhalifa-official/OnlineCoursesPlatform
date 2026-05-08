const mongoose = require("mongoose");
const User = require("../Models/user");
const SystemLog = require("../Models/SystemLog");

const defaultAdminPermissions = {
  accessDashboard: true,
  manageUsers: false,
  manageAdmins: false,
  manageCourses: false,
  manageEducationalCenters: false,
  managePayments: false,
  manageReports: false,
  manageSettings: false,
  manageSystemLogs: false,
  approveInstructors: false,
  manageSupportRequests: false,
  permissionLevel: "Basic",
  accessNote:
    "Admin access is limited based on assigned permissions. Only super admins can update admin permissions.",
};

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
}

function getUserName(user) {
  return (
    user.fullName ||
    user.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.username ||
    "Admin"
  );
}

function getAuthPayload(req) {
  return req.user || req.admin || req.auth || req.decoded || req.currentUser || {};
}

function getAuthId(req) {
  const payload = getAuthPayload(req);

  return (
    payload._id ||
    payload.id ||
    payload.userId ||
    payload.adminId ||
    payload.sub ||
    null
  );
}

function getAuthEmail(req) {
  const payload = getAuthPayload(req);
  return payload.email || null;
}

function getAuthUsername(req) {
  const payload = getAuthPayload(req);
  return payload.username || null;
}

function isSuperAdminUser(user) {
  if (!user) return false;

  const role = normalize(user.role);
  const adminLevel = normalize(user.adminLevel);
  const accessLevel = normalize(user.accessLevel);
  const permissionsLevel = normalize(user.permissionsLevel);

  return (
    role === "admin" &&
    (
      adminLevel === "super_admin" ||
      accessLevel === "super_admin" ||
      accessLevel === "superadmin" ||
      accessLevel === "full_access" ||
      permissionsLevel === "full"
    )
  );
}

async function getCurrentLoggedAdmin(req) {
  const payload = getAuthPayload(req);
  const authId = getAuthId(req);
  const email = getAuthEmail(req);
  const username = getAuthUsername(req);

  const orConditions = [];

  if (authId && mongoose.Types.ObjectId.isValid(authId)) {
    orConditions.push({ _id: authId });
  }

  if (email) {
    orConditions.push({ email: String(email).toLowerCase() });
  }

  if (username) {
    orConditions.push({ username: String(username).toLowerCase() });
  }

  if (orConditions.length > 0) {
    const dbUser = await User.findOne({ $or: orConditions }).select(
      "role adminLevel accessLevel permissionsLevel email username fullName name firstName lastName"
    );

    if (dbUser) return dbUser;
  }

  return payload;
}

async function createLog(data) {
  try {
    await SystemLog.create(data);
  } catch (error) {
    console.error("Admin permissions log error:", error.message);
  }
}

const getAdminPermissions = async function (req, res) {
  try {
    const currentAdmin = await getCurrentLoggedAdmin(req);
    const canEdit = isSuperAdminUser(currentAdmin);

    const admin = await User.findById(req.params.id).select(
      "firstName lastName fullName name username email role adminLevel accessLevel permissionsLevel adminPermissions educationalCenter center updatedAt"
    );

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    if (admin.role !== "admin") {
      return res.status(400).json({
        message: "This page is only available for admins",
      });
    }

    return res.status(200).json({
      canEdit,
      currentAdmin: currentAdmin
        ? {
            _id: currentAdmin._id,
            email: currentAdmin.email,
            username: currentAdmin.username,
            role: currentAdmin.role,
            adminLevel: currentAdmin.adminLevel,
            accessLevel: currentAdmin.accessLevel,
            permissionsLevel: currentAdmin.permissionsLevel,
          }
        : null,
      admin: {
        _id: admin._id,
        name: getUserName(admin),
        email: admin.email || "",
        role: admin.role,
        adminLevel: admin.adminLevel || "admin",
        accessLevel: admin.accessLevel || "",
        permissionsLevel: admin.permissionsLevel || "basic",
        center: admin.educationalCenter || admin.center || "-",
        updatedAt: admin.updatedAt,
      },
      permissions: {
        ...defaultAdminPermissions,
        ...(admin.adminPermissions || {}),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get admin permissions",
      error: error.message,
    });
  }
};

const updateAdminPermissions = async function (req, res) {
  try {
    const currentAdmin = await getCurrentLoggedAdmin(req);
    const canEdit = isSuperAdminUser(currentAdmin);

    if (!canEdit) {
      return res.status(403).json({
        message: "Only super admin can update admin permissions",
        currentAdmin: currentAdmin
          ? {
              _id: currentAdmin._id,
              email: currentAdmin.email,
              username: currentAdmin.username,
              role: currentAdmin.role,
              adminLevel: currentAdmin.adminLevel,
              accessLevel: currentAdmin.accessLevel,
              permissionsLevel: currentAdmin.permissionsLevel,
            }
          : null,
      });
    }

    const {
      accessDashboard,
      manageUsers,
      manageAdmins,
      manageCourses,
      manageEducationalCenters,
      managePayments,
      manageReports,
      manageSettings,
      manageSystemLogs,
      approveInstructors,
      manageSupportRequests,
      permissionLevel,
      accessNote,
      adminLevel,
      accessLevel,
      permissionsLevel,
    } = req.body;

    const targetAdmin = await User.findById(req.params.id);

    if (!targetAdmin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    if (targetAdmin.role !== "admin") {
      return res.status(400).json({
        message: "This user is not an admin",
      });
    }

    const currentUserId = String(currentAdmin._id || "");
    const targetUserId = String(targetAdmin._id || "");

    const nextAdminLevel = adminLevel || targetAdmin.adminLevel;
    const nextAccessLevel = accessLevel || targetAdmin.accessLevel;
    const nextPermissionsLevel = permissionsLevel || targetAdmin.permissionsLevel;

    const removingOwnSuperAdmin =
      currentUserId === targetUserId &&
      isSuperAdminUser(targetAdmin) &&
      normalize(nextAdminLevel) !== "super_admin" &&
      normalize(nextAccessLevel) !== "super_admin" &&
      normalize(nextPermissionsLevel) !== "full";

    if (removingOwnSuperAdmin) {
      return res.status(400).json({
        message: "Super admin cannot remove their own super admin access",
      });
    }

    targetAdmin.adminPermissions = {
      accessDashboard: Boolean(accessDashboard),
      manageUsers: Boolean(manageUsers),
      manageAdmins: Boolean(manageAdmins),
      manageCourses: Boolean(manageCourses),
      manageEducationalCenters: Boolean(manageEducationalCenters),
      managePayments: Boolean(managePayments),
      manageReports: Boolean(manageReports),
      manageSettings: Boolean(manageSettings),
      manageSystemLogs: Boolean(manageSystemLogs),
      approveInstructors: Boolean(approveInstructors),
      manageSupportRequests: Boolean(manageSupportRequests),
      permissionLevel: permissionLevel || "Basic",
      accessNote: accessNote || defaultAdminPermissions.accessNote,
    };

    if (adminLevel === "admin" || adminLevel === "super_admin") {
      targetAdmin.adminLevel = adminLevel;
    }

    if (accessLevel !== undefined) {
      targetAdmin.accessLevel = accessLevel;
    }

    if (
      permissionsLevel === "basic" ||
      permissionsLevel === "moderate" ||
      permissionsLevel === "full"
    ) {
      targetAdmin.permissionsLevel = permissionsLevel;
    }

    await targetAdmin.save();

    await createLog({
      action: "Admin Permissions Updated",
      module: "Users",
      description: `Admin permissions updated for ${getUserName(targetAdmin)}`,
      status: "Success",
      statusCode: 200,
      actorName: getUserName(currentAdmin),
    });

    return res.status(200).json({
      message: "Admin permissions updated successfully",
      canEdit: true,
      currentAdmin: {
        _id: currentAdmin._id,
        email: currentAdmin.email,
        username: currentAdmin.username,
        role: currentAdmin.role,
        adminLevel: currentAdmin.adminLevel,
        accessLevel: currentAdmin.accessLevel,
        permissionsLevel: currentAdmin.permissionsLevel,
      },
      admin: {
        _id: targetAdmin._id,
        name: getUserName(targetAdmin),
        email: targetAdmin.email || "",
        role: targetAdmin.role,
        adminLevel: targetAdmin.adminLevel || "admin",
        accessLevel: targetAdmin.accessLevel || "",
        permissionsLevel: targetAdmin.permissionsLevel || "basic",
        center: targetAdmin.educationalCenter || targetAdmin.center || "-",
        updatedAt: targetAdmin.updatedAt,
      },
      permissions: targetAdmin.adminPermissions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update admin permissions",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminPermissions,
  updateAdminPermissions,
};