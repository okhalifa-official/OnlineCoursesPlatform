const User = require("../Models/User");
const Course = require("../Models/Course");

function normalize(value) {
  return String(value || "").toLowerCase();
}

function getMonthName(date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

const getReportsOverview = async function (req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const courses = await Course.find().sort({ createdAt: -1 });

    const totalUsers = users.length;

    const students = users.filter((user) => normalize(user.role) === "student");
    const instructors = users.filter(
      (user) => normalize(user.role) === "instructor"
    );
    const admins = users.filter((user) => normalize(user.role) === "admin");

    const activeUsers = users.filter(
      (user) => normalize(user.status) === "active"
    );

    const pendingInstructors = users.filter(
      (user) =>
        normalize(user.role) === "instructor" &&
        normalize(user.status) === "pending"
    );

    const suspendedUsers = users.filter(
      (user) =>
        normalize(user.status) === "suspended" ||
        normalize(user.status) === "blocked" ||
        normalize(user.status) === "inactive"
    );

    const totalCourses = courses.length;

    const publishedCourses = courses.filter(
      (course) => course.publishStatus === "Published"
    );

    const draftCourses = courses.filter(
      (course) => course.publishStatus === "Draft"
    );

    const archivedCourses = courses.filter(
      (course) => course.publishStatus === "Archived"
    );

    const totalRevenue = courses.reduce((total, course) => {
      const price = Number(course.coursePrice || 0);
      const studentsCount = Number(course.activeStudents || 0);
      return total + price * studentsCount;
    }, 0);

    const avgCompletion =
      courses.length === 0
        ? 0
        : Math.round(
            courses.reduce(
              (total, course) => total + Number(course.completionRate || 0),
              0
            ) / courses.length
          );

    const openTickets = courses.reduce((total, course) => {
      return total + Number(course.openTickets || 0);
    }, 0);

    const coursePerformance = courses.map((course) => {
      const price = Number(course.coursePrice || 0);
      const studentsCount = Number(course.activeStudents || 0);

      return {
        _id: course._id,
        courseName: course.courseName,
        publishStatus: course.publishStatus,
        instructor: course.instructor || "Unassigned",
        activeStudents: studentsCount,
        coursePrice: price,
        revenue: price * studentsCount,
        completionRate: Number(course.completionRate || 0),
      };
    });

    const topCourses = [...coursePerformance]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const lowCompletionCourses = [...coursePerformance]
      .filter((course) => course.completionRate < 50)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5);

    const usersByMonth = {};

    users.forEach((user) => {
      const month = getMonthName(user.createdAt || new Date());
      usersByMonth[month] = (usersByMonth[month] || 0) + 1;
    });

    const coursesByMonth = {};

    courses.forEach((course) => {
      const month = getMonthName(course.createdAt || new Date());
      coursesByMonth[month] = (coursesByMonth[month] || 0) + 1;
    });

    const userGrowth = Object.keys(usersByMonth).map((month) => ({
      month,
      count: usersByMonth[month],
    }));

    const courseGrowth = Object.keys(coursesByMonth).map((month) => ({
      month,
      count: coursesByMonth[month],
    }));

    res.json({
      summary: {
        totalUsers,
        activeUsers: activeUsers.length,
        students: students.length,
        instructors: instructors.length,
        admins: admins.length,
        pendingInstructors: pendingInstructors.length,
        suspendedUsers: suspendedUsers.length,
        totalCourses,
        publishedCourses: publishedCourses.length,
        draftCourses: draftCourses.length,
        archivedCourses: archivedCourses.length,
        totalRevenue,
        avgCompletion,
        openTickets,
      },

      roleDistribution: [
        { label: "Students", value: students.length },
        { label: "Instructors", value: instructors.length },
        { label: "Admins", value: admins.length },
      ],

      courseStatusDistribution: [
        { label: "Published", value: publishedCourses.length },
        { label: "Draft", value: draftCourses.length },
        { label: "Archived", value: archivedCourses.length },
      ],

      topCourses,
      lowCompletionCourses,
      userGrowth,
      courseGrowth,

      recentUsers: users.slice(0, 5),
      recentCourses: courses.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate reports",
      error: error.message,
    });
  }
};

module.exports = {
  getReportsOverview,
};