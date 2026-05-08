const SystemLog = require("../Models/SystemLog");

function buildDateFilter(date) {
  if (!date) return {};

  const now = new Date();

  if (date === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };
  }

  if (date === "7days") {
    const start = new Date();
    start.setDate(start.getDate() - 7);

    return {
      createdAt: {
        $gte: start,
      },
    };
  }

  if (date === "30days") {
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return {
      createdAt: {
        $gte: start,
      },
    };
  }

  return {};
}

const getSystemLogs = async function (req, res) {
  try {
    const {
      search = "",
      role = "",
      action = "",
      status = "",
      module = "",
      date = "",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search, "i");

      filter.$or = [
        { actorName: regex },
        { actorEmail: regex },
        { actorRole: regex },
        { action: regex },
        { module: regex },
        { targetEntity: regex },
        { status: regex },
        { ipAddress: regex },
      ];
    }

    if (role) {
      filter.actorRole = role;
    }

    if (action) {
      filter.actionType = action;
    }

    if (status) {
      filter.status = status;
    }

    if (module) {
      filter.module = module;
    }

    Object.assign(filter, buildDateFilter(date));

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const [logs, total] = await Promise.all([
      SystemLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      SystemLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      logs,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get system logs",
      error: error.message,
    });
  }
};

const getSystemLogById = async function (req, res) {
  try {
    const log = await SystemLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        message: "System log not found",
      });
    }

    return res.status(200).json(log);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get system log",
      error: error.message,
    });
  }
};

const getSystemLogStats = async function (req, res) {
  try {
    const [
      totalActivity,
      failedActivity,
      successActivity,
      securityAlerts,
      activeSessions,
    ] = await Promise.all([
      SystemLog.countDocuments(),
      SystemLog.countDocuments({ status: "Failed" }),
      SystemLog.countDocuments({ status: "Success" }),
      SystemLog.countDocuments({
        $or: [{ severity: "High" }, { status: "Failed" }],
      }),
      SystemLog.distinct("actorId", {
        createdAt: {
          $gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      }),
    ]);

    return res.status(200).json({
      totalActivity,
      failedActivity,
      successActivity,
      securityAlerts,
      activeSessions: activeSessions.filter(Boolean).length,
      storageUsage: 42,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get system log stats",
      error: error.message,
    });
  }
};

module.exports = {
  getSystemLogs,
  getSystemLogById,
  getSystemLogStats,
};