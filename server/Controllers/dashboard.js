const User = require("../Models/User");
const Course = require("../Models/Course");

function normalize(value) {
  return String(value || "").toLowerCase();
}

function formatCurrency(value) {
  const number = Number(value || 0);

  if (number >= 1000000) {
    return `$${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `$${(number / 1000).toFixed(1)}K`;
  }

  return `$${number}`;
}

function timeAgo(date) {
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

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getPreviousMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function calculatePercentageChange(current, previous) {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0 && current > 0) return "+100%";

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);

  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

async function getDashboardStats() {
  const users = await User.find().sort({ createdAt: -1 });
  const courses = await Course.find().sort({ createdAt: -1 });

  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const previousMonthStart = getPreviousMonthStart(now);

  const totalUsers = users.length;

  const activeUsers = users.filter((user) => {
    return normalize(user.status) === "active";
  }).length;

  const totalCourses = courses.length;

  const totalRevenue = courses.reduce((total, course) => {
    const price = Number(course.coursePrice || 0);
    const students = Number(course.activeStudents || 0);
    return total + price * students;
  }, 0);

  const newSignups = users.filter((user) => {
    return new Date(user.createdAt) >= currentMonthStart;
  }).length;

  const currentMonthUsers = users.filter((user) => {
    return new Date(user.createdAt) >= currentMonthStart;
  }).length;

  const previousMonthUsers = users.filter((user) => {
    const date = new Date(user.createdAt);
    return date >= previousMonthStart && date < currentMonthStart;
  }).length;

  const activeUsersThisMonth = users.filter((user) => {
    return (
      normalize(user.status) === "active" &&
      new Date(user.createdAt) >= currentMonthStart
    );
  }).length;

  const activeUsersPreviousMonth = users.filter((user) => {
    const date = new Date(user.createdAt);

    return (
      normalize(user.status) === "active" &&
      date >= previousMonthStart &&
      date < currentMonthStart
    );
  }).length;

  const currentMonthRevenue = courses.reduce((total, course) => {
    const date = new Date(course.createdAt);

    if (date < currentMonthStart) return total;

    return (
      total +
      Number(course.coursePrice || 0) * Number(course.activeStudents || 0)
    );
  }, 0);

  const previousMonthRevenue = courses.reduce((total, course) => {
    const date = new Date(course.createdAt);

    if (date < previousMonthStart || date >= currentMonthStart) return total;

    return (
      total +
      Number(course.coursePrice || 0) * Number(course.activeStudents || 0)
    );
  }, 0);

  const avgCompletion =
    courses.length === 0
      ? 0
      : Math.round(
          courses.reduce((total, course) => {
            return total + Number(course.completionRate || 0);
          }, 0) / courses.length
        );

  const courseEngagement =
    courses.length === 0
      ? 0
      : Math.round(
          courses.reduce((total, course) => {
            const students = Number(course.activeStudents || 0);
            const completion = Number(course.completionRate || 0);
            return total + students * (completion / 100);
          }, 0)
        );

  const pendingInstructors = users.filter((user) => {
    return normalize(user.role) === "instructor" && normalize(user.status) === "pending";
  }).length;

  const suspendedUsers = users.filter((user) => {
    return (
      normalize(user.status) === "suspended" ||
      normalize(user.status) === "inactive" ||
      normalize(user.status) === "blocked"
    );
  }).length;

  const draftCourses = courses.filter((course) => {
    return course.publishStatus === "Draft";
  }).length;

  const openTickets = courses.reduce((total, course) => {
    return total + Number(course.openTickets || 0);
  }, 0);

  const systemErrors = 0;
  const failedPayments = 0;

  return {
    users,
    courses,

    totalUsers,
    activeUsers,
    totalCourses,
    totalRevenue,
    newSignups,
    avgCompletion,

    currentMonthUsers,
    previousMonthUsers,
    activeUsersThisMonth,
    activeUsersPreviousMonth,
    currentMonthRevenue,
    previousMonthRevenue,

    courseEngagement,
    pendingInstructors,
    suspendedUsers,
    draftCourses,
    openTickets,
    systemErrors,
    failedPayments,
  };
}

const getDashboardOverview = async function (req, res) {
  try {
    const stats = await getDashboardStats();

    res.json({
      totalUsers: stats.totalUsers.toLocaleString(),
      activeUsers: stats.activeUsers.toLocaleString(),
      totalCourses: stats.totalCourses.toLocaleString(),
      revenue: formatCurrency(stats.totalRevenue),
      newSignups: stats.newSignups.toLocaleString(),
      completionRate: `${stats.avgCompletion}%`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get dashboard overview",
      error: error.message,
    });
  }
};

const getNotifications = async function (req, res) {
  try {
    const stats = await getDashboardStats();

    const notifications = [];

    if (stats.pendingInstructors > 0) {
      notifications.push({
        id: "pending-instructors",
        type: "instructor",
        title: "Instructor approval required",
        description: `${stats.pendingInstructors} instructor account(s) waiting for approval`,
        icon: "verified",
        link: "/approve-instructors",
      });
    }

    if (stats.draftCourses > 0) {
      notifications.push({
        id: "draft-courses",
        type: "course",
        title: "Draft courses need completion",
        description: `${stats.draftCourses} draft course(s) are not published yet`,
        icon: "draft",
        link: "/courses",
      });
    }

    if (stats.openTickets > 0) {
      notifications.push({
        id: "open-tickets",
        type: "support",
        title: "Open course tickets",
        description: `${stats.openTickets} course support ticket(s) need review`,
        icon: "warning",
        link: "/reports",
      });
    }

    const latestUser = stats.users[0];

    if (latestUser) {
      notifications.push({
        id: `latest-user-${latestUser._id}`,
        type: "user",
        title: "New user registered",
        description: `${latestUser.fullName || latestUser.name || latestUser.email} created an account`,
        icon: "person_add",
        link: "/users",
      });
    }

    const latestCourse = stats.courses[0];

    if (latestCourse) {
      notifications.push({
        id: `latest-course-${latestCourse._id}`,
        type: "course",
        title: "Latest course update",
        description: `${latestCourse.courseName} is currently ${latestCourse.publishStatus}`,
        icon: "menu_book",
        link: "/courses",
      });
    }

    res.json(notifications.slice(0, 5));
  } catch (error) {
    res.status(500).json({
      message: "Failed to get notifications",
      error: error.message,
    });
  }
};

const getRecentActivity = async function (req, res) {
  try {
    const stats = await getDashboardStats();

    const userActivities = stats.users.slice(0, 5).map((user) => ({
      id: `user-${user._id}`,
      title: "User registered",
      description: `${user.fullName || user.name || user.email} joined as ${user.role}`,
      icon: "person",
      time: timeAgo(user.createdAt),
      color: "red",
      createdAt: user.createdAt,
    }));

    const courseActivities = stats.courses.slice(0, 5).map((course) => ({
      id: `course-${course._id}`,
      title: "Course added",
      description: `${course.courseName} was created as ${course.publishStatus}`,
      icon: "menu_book",
      time: timeAgo(course.createdAt),
      color: "dark",
      createdAt: course.createdAt,
    }));

    const activities = [...userActivities, ...courseActivities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json(activities);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get recent activity",
      error: error.message,
    });
  }
};

const getAlerts = async function (req, res) {
  try {
    const stats = await getDashboardStats();

    res.json({
      failedPayments: stats.failedPayments,
      reportedUsers: stats.suspendedUsers,
      pendingApprovals: stats.pendingInstructors + stats.draftCourses,
      systemErrors: stats.systemErrors,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get alerts",
      error: error.message,
    });
  }
};

const getPerformance = async function (req, res) {
  try {
    const stats = await getDashboardStats();

    res.json({
      userGrowth: calculatePercentageChange(
        stats.currentMonthUsers,
        stats.previousMonthUsers
      ),
      courseEngagement: `${stats.avgCompletion}%`,
      revenueTrend: calculatePercentageChange(
        stats.currentMonthRevenue,
        stats.previousMonthRevenue
      ),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get performance",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardOverview,
  getNotifications,
  getRecentActivity,
  getAlerts,
  getPerformance,
};