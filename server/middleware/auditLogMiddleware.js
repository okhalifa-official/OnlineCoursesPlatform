const SystemLog = require("../Models/SystemLog");

function sanitizeData(data) {
  if (!data || typeof data !== "object") return data;

  const clean = { ...data };

  delete clean.password;
  delete clean.confirmPassword;
  delete clean.passwordHash;
  delete clean.token;
  delete clean.adminToken;
  delete clean.userToken;

  return clean;
}

function getActor(req) {
  const user = req.user;

  if (!user) {
    return {
      actorId: undefined,
      actorName: req.body?.username || req.body?.email || "Unknown User",
      actorEmail: req.body?.email || "",
      actorRole: "Guest",
    };
  }

  const actorName =
    user.fullName ||
    user.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.username ||
    user.email ||
    "Unknown User";

  return {
    actorId: user._id,
    actorName,
    actorEmail: user.email || "",
    actorRole:
      user.adminLevel === "super_admin"
        ? "Super Admin"
        : user.role === "admin"
        ? "Admin"
        : user.role || "User",
  };
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    ""
  );
}

function getModuleFromPath(path) {
  if (path.includes("/educational-centers")) return "Educational Centers";
  if (path.includes("/payments")) return "Payments";
  if (path.includes("/settings")) return "Settings";
  if (path.includes("/users")) return "Users";
  if (path.includes("/courses")) return "Courses";
  if (path.includes("/reports")) return "Reports";
  if (path.includes("/lectures")) return "Lectures";
  if (path.includes("/admin")) return "Admin";
  if (path.includes("/auth")) return "Authentication";
  if (path.includes("/user")) return "User Side";

  return "System";
}

function getActionFromRequest(req) {
  const method = req.method.toUpperCase();
  const path = req.originalUrl || req.path;

  if (path.includes("/login")) {
    return {
      action: "Login Attempt",
      actionType: "login",
      severity: "Medium",
    };
  }

  if (path.includes("/backup")) {
    return {
      action: "Manual Backup",
      actionType: "update",
      severity: "Medium",
    };
  }

  if (path.includes("/restore")) {
    return {
      action: "Restore Data",
      actionType: "update",
      severity: "High",
    };
  }

  if (path.includes("/reminder")) {
    return {
      action: "Reminder Sent",
      actionType: "update",
      severity: "Low",
    };
  }

  if (path.includes("/refund")) {
    return {
      action: "Refund Requested",
      actionType: "update",
      severity: "High",
    };
  }

  if (path.includes("/status")) {
    return {
      action: "Status Updated",
      actionType: "update",
      severity: "Medium",
    };
  }

  if (method === "POST") {
    return {
      action: "Created",
      actionType: "create",
      severity: "Low",
    };
  }

  if (method === "PUT" || method === "PATCH") {
    return {
      action: "Updated",
      actionType: "update",
      severity: "Medium",
    };
  }

  if (method === "DELETE") {
    return {
      action: "Deleted",
      actionType: "delete",
      severity: "High",
    };
  }

  return {
    action: "System Action",
    actionType: "system",
    severity: "Low",
  };
}

function getTargetEntity(req, res) {
  if (res.locals.auditTarget) {
    return res.locals.auditTarget;
  }

  const path = req.originalUrl || req.path;

  if (path.includes("/settings/general")) return "General Settings";
  if (path.includes("/settings/security")) return "Security Settings";
  if (path.includes("/settings/notifications")) return "Notification Settings";
  if (path.includes("/settings/backup")) return "Manual Backup";
  if (path.includes("/settings/restore")) return "Restore Data";

  if (path.includes("/payments/settings")) {
    return "Payment Settings";
  }

  if (path.includes("/payments")) {
    return (
      req.body?.transactionId ||
      req.body?.courseName ||
      req.body?.userName ||
      req.params?.id ||
      "Payment Transaction"
    );
  }

  const fullName = `${req.body?.firstName || ""} ${
    req.body?.lastName || ""
  }`.trim();

  return (
    req.body?.name ||
    req.body?.centerName ||
    req.body?.title ||
    req.body?.courseName ||
    req.body?.fullName ||
    fullName ||
    req.body?.email ||
    req.body?.username ||
    req.body?.centerCode ||
    req.params?.id ||
    "-"
  );
}

function getPayload(req, res) {
  if (res.locals.auditPayload) {
    return sanitizeData(res.locals.auditPayload);
  }

  return sanitizeData(req.body);
}

function auditLogMiddleware(req, res, next) {
  const method = req.method.toUpperCase();

  const shouldTrack =
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    !req.originalUrl.includes("/api/system-logs");

  if (!shouldTrack) {
    return next();
  }

  res.on("finish", async function () {
    try {
      const { action, actionType, severity } = getActionFromRequest(req);
      const actor = getActor(req);

      const status =
        res.statusCode >= 200 && res.statusCode < 400 ? "Success" : "Failed";

      const moduleName = getModuleFromPath(req.originalUrl);
      const targetEntity = getTargetEntity(req, res);

      const log = await SystemLog.create({
        ...actor,
        module: moduleName,
        action: status === "Failed" ? `Failed ${action}` : action,
        actionType,
        targetEntity,
        targetId: req.params?.id || "",
        status,
        statusCode: res.statusCode,
        severity: status === "Failed" ? "High" : severity,
        description: `${actor.actorName} ${
          status === "Failed" ? "failed to perform" : "performed"
        } ${action} on ${moduleName}`,
        method: req.method,
        path: req.originalUrl,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
        newData: getPayload(req, res),
      });

      console.log("SYSTEM LOG SAVED:", {
        id: log._id.toString(),
        actor: log.actorName,
        module: log.module,
        action: log.action,
        targetEntity: log.targetEntity,
        status: log.status,
      });
    } catch (error) {
      console.error("Audit log error:", error.message);
    }
  });

  next();
}

module.exports = auditLogMiddleware;