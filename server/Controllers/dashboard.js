const User = require("../Models/user");
const PaymentTransaction = require("../Models/PaymentTransaction");
const SystemLog = require("../Models/SystemLog");

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatPercent(value) {
  const number = Number(value || 0);

  if (number > 0) {
    return `+${number}%`;
  }

  return `${number}%`;
}

function calculateGrowth(currentValue, previousValue) {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0 && current === 0) {
    return 0;
  }

  if (previous === 0 && current > 0) {
    return 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function getMonthRanges() {
  const now = new Date();

  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    startOfThisMonth,
    startOfNextMonth,
    startOfLastMonth,
    endOfLastMonth,
  };
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;

  return new Date(date).toLocaleDateString();
}

function getIconByModule(moduleName) {
  if (moduleName === "Payments") return "payments";
  if (moduleName === "Users") return "group";
  if (moduleName === "Courses") return "menu_book";
  if (moduleName === "Educational Centers") return "home";
  if (moduleName === "Reports") return "bar_chart";
  if (moduleName === "Authentication") return "lock";
  if (moduleName === "Announcements") return "campaign";

  return "notifications";
}

function getLinkByModule(moduleName) {
  if (moduleName === "Payments") return "/payments";
  if (moduleName === "Users") return "/users";
  if (moduleName === "Courses") return "/admin/courses";
  if (moduleName === "Educational Centers") return "/educational-centers";
  if (moduleName === "Reports") return "/reports";
  if (moduleName === "Authentication") return "/logs";
  if (moduleName === "Announcements") return "/bulk-announcements";

  return "/logs";
}

function formatLog(log) {
  return {
    id: log._id,
    title: log.action || "System Activity",
    description:
      log.description ||
      `${log.actorName || "Someone"} performed an action in ${
        log.module || "System"
      }`,
    action: log.action,
    module: log.module,
    icon: getIconByModule(log.module),
    color: log.status === "Failed" ? "red" : "dark",
    link: getLinkByModule(log.module),
    time: timeAgo(log.createdAt),
    createdByName: log.actorName,
    createdAt: log.createdAt,
  };
}

async function getRevenueBetween(startDate, endDate) {
  const result = await PaymentTransaction.aggregate([
    {
      $match: {
        status: "success",
        paymentDate: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  return result[0]?.total || 0;
}

async function getTotalRevenue() {
  const result = await PaymentTransaction.aggregate([
    {
      $match: {
        status: "success",
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  return result[0]?.total || 0;
}

const getDashboardOverview = async function (req, res) {
  try {
    const { startOfThisMonth, startOfNextMonth } = getMonthRanges();

    const totalUsers = await User.countDocuments();

    const activeUsers = await User.countDocuments({
      status: "active",
    });

    const newSignups = await User.countDocuments({
      createdAt: {
        $gte: startOfThisMonth,
        $lt: startOfNextMonth,
      },
    });

    const totalRevenue = await getTotalRevenue();

    const totalPayments = await PaymentTransaction.countDocuments();

    const successPayments = await PaymentTransaction.countDocuments({
      status: "success",
    });

    const completionRate =
      totalPayments === 0
        ? 0
        : Math.round((successPayments / totalPayments) * 100);

    return res.status(200).json({
      totalUsers,
      activeUsers,
      totalCourses: 0,
      revenue: formatMoney(totalRevenue),
      newSignups,
      completionRate: `${completionRate}%`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get dashboard overview",
      error: error.message,
    });
  }
};

const getNotifications = async function (req, res) {
  try {
    const logs = await SystemLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(10);

    return res.status(200).json(logs.map(formatLog));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get notifications",
      error: error.message,
    });
  }
};
const getAllNotifications = async function (req, res) {
  try {
    const logs = await SystemLog.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(logs.map(formatLog));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get all notifications",
      error: error.message,
    });
  }
};
const getRecentActivity = async function (req, res) {
  try {
    const logs = await SystemLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(12);

    return res.status(200).json(logs.map(formatLog));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get recent activity",
      error: error.message,
    });
  }
};

const getAlerts = async function (req, res) {
  try {
    const failedPayments = await PaymentTransaction.countDocuments({
      status: "failed",
    });

    const reportedUsers = await User.countDocuments({
      status: "reported",
    });

    const pendingApprovals = await User.countDocuments({
      status: "pending",
    });

    const systemErrors = await SystemLog.countDocuments({
      status: "Failed",
      statusCode: {
        $gte: 500,
      },
    });

    return res.status(200).json({
      failedPayments,
      reportedUsers,
      pendingApprovals,
      systemErrors,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get dashboard alerts",
      error: error.message,
    });
  }
};

const getPerformance = async function (req, res) {
  try {
    const {
      startOfThisMonth,
      startOfNextMonth,
      startOfLastMonth,
      endOfLastMonth,
    } = getMonthRanges();

    const thisMonthNewUsers = await User.countDocuments({
      createdAt: {
        $gte: startOfThisMonth,
        $lt: startOfNextMonth,
      },
    });

    const lastMonthNewUsers = await User.countDocuments({
      createdAt: {
        $gte: startOfLastMonth,
        $lt: endOfLastMonth,
      },
    });

    const userGrowthValue = calculateGrowth(
      thisMonthNewUsers,
      lastMonthNewUsers,
    );

    const totalPayments = await PaymentTransaction.countDocuments();

    const successPayments = await PaymentTransaction.countDocuments({
      status: "success",
    });

    const courseEngagementValue =
      totalPayments === 0
        ? 0
        : Math.round((successPayments / totalPayments) * 100);

    const thisMonthRevenue = await getRevenueBetween(
      startOfThisMonth,
      startOfNextMonth,
    );

    const lastMonthRevenue = await getRevenueBetween(
      startOfLastMonth,
      endOfLastMonth,
    );

    const revenueTrendValue = calculateGrowth(
      thisMonthRevenue,
      lastMonthRevenue,
    );

    return res.status(200).json({
      userGrowth: formatPercent(userGrowthValue),
      courseEngagement: `${courseEngagementValue}%`,
      revenueTrend: formatPercent(revenueTrendValue),

      raw: {
        thisMonthNewUsers,
        lastMonthNewUsers,
        totalPayments,
        successPayments,
        thisMonthRevenue,
        lastMonthRevenue,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get dashboard performance",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardOverview,
  getNotifications,
  getAllNotifications,
  getRecentActivity,
  getAlerts,
  getPerformance,
};
