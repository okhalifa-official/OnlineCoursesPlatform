const PageContent = require("../Models/PageContent");
const SystemLog = require("../Models/SystemLog");

const defaultPages = [
  { pageKey: "landing", pageName: "Landing Page" },
  { pageKey: "user-home", pageName: "User Home" },
  { pageKey: "courses", pageName: "Courses Page" },
  { pageKey: "why-us", pageName: "Why Us Page" },
  { pageKey: "about-us", pageName: "About Us Page" },
  { pageKey: "board-of-directors", pageName: "Board Of Directors" },
  { pageKey: "business-partners", pageName: "Business Partners" },
  { pageKey: "clinical-advisors", pageName: "Clinical Advisors" },
  { pageKey: "mena-board", pageName: "MENA Board" },
  { pageKey: "mission-vision", pageName: "Mission Vision" },
  { pageKey: "policies", pageName: "Policies" },
  { pageKey: "scientific-committee", pageName: "Scientific Committee" },
  { pageKey: "scientific-partners", pageName: "Scientific Partners" },
];

function getCurrentAdmin(req) {
  return req.user || req.admin || req.auth || {};
}

function getAdminName(admin) {
  return (
    admin.fullName ||
    admin.name ||
    `${admin.firstName || ""} ${admin.lastName || ""}`.trim() ||
    admin.username ||
    admin.email ||
    "Admin"
  );
}

async function createSystemLog(data) {
  try {
    await SystemLog.create(data);
  } catch (error) {
    console.error("Page content log error:", error.message);
  }
}

function validatePageData(pageKey, pageData) {
  const data = pageData || {};

  if (pageKey === "mission-vision") {
    if (!data.mission) return "Mission is required";
    if (!data.vision) return "Vision is required";
    return null;
  }

  if (pageKey === "board-of-directors" || pageKey === "mena-board") {
    if (!Array.isArray(data.members) || data.members.length === 0) {
      return "At least one member is required";
    }
    return null;
  }

  if (pageKey === "scientific-committee") {
    if (!Array.isArray(data.countries) || data.countries.length === 0) {
      return "At least one country is required";
    }
    return null;
  }

  if (pageKey === "clinical-advisors") {
    if (!Array.isArray(data.advisors) || data.advisors.length === 0) {
      return "At least one advisor is required";
    }
    return null;
  }

  if (pageKey === "business-partners" || pageKey === "scientific-partners") {
    if (!Array.isArray(data.partners) || data.partners.length === 0) {
      return "At least one partner is required";
    }
    return null;
  }

  if (pageKey === "policies") {
    if (!Array.isArray(data.policies) || data.policies.length === 0) {
      return "At least one policy is required";
    }
    return null;
  }

  return null;
}

const getPageContentMeta = async function (req, res) {
  try {
    return res.status(200).json(defaultPages);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load page content meta",
      error: error.message,
    });
  }
};

const getAllPageContents = async function (req, res) {
  try {
    const pages = await PageContent.find().sort({ pageName: 1 });

    return res.status(200).json(pages);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load page contents",
      error: error.message,
    });
  }
};

const getPageContentByKey = async function (req, res) {
  try {
    const { pageKey } = req.params;

    let page = await PageContent.findOne({ pageKey });

    if (!page) {
      const pageMeta = defaultPages.find((item) => item.pageKey === pageKey);

      page = await PageContent.create({
        pageKey,
        pageName: pageMeta?.pageName || pageKey,
        title: pageMeta?.pageName || pageKey,
        description: "",
        hero: {
          title: pageMeta?.pageName || pageKey,
          subtitle: "",
          description: "",
          imageUrl: "",
          buttonText: "",
          buttonLink: "",
        },
        sections: [],
        isPublished: true,
      });
    }

    return res.status(200).json(page);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load page content",
      error: error.message,
    });
  }
};

const updatePageContent = async function (req, res) {
  try {
    const { pageKey } = req.params;

    const {
      pageName,
      title,
      description,
      hero,
      sections,
      pageData,
      isPublished,
    } = req.body;

    const validationError = validatePageData(pageKey, pageData);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const admin = getCurrentAdmin(req);

    const updatedPage = await PageContent.findOneAndUpdate(
      { pageKey },
      {
        $set: {
          pageKey,
          pageName: pageName || pageKey,
          title: title || "",
          description: description || "",
          hero: hero || {},
          sections: Array.isArray(sections) ? sections : [],
          pageData: pageData || {},
          isPublished: typeof isPublished === "boolean" ? isPublished : true,
          updatedByName: getAdminName(admin),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    await createSystemLog({
      action: "Page Content Updated",
      module: "Settings",
      description: `${getAdminName(admin)} updated ${updatedPage.pageName}`,
      status: "Success",
      statusCode: 200,
      actorName: getAdminName(admin),
    });

    return res.status(200).json({
      message: "Page content updated successfully",
      page: updatedPage,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update page content",
      error: error.message,
    });
  }
};

const getPublicPageContentByKey = async function (req, res) {
  try {
    const { pageKey } = req.params;

    const page = await PageContent.findOne({
      pageKey,
      isPublished: true,
    });

    return res.status(200).json(page || null);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load public page content",
      error: error.message,
    });
  }
};

module.exports = {
  getPageContentMeta,
  getAllPageContents,
  getPageContentByKey,
  updatePageContent,
  getPublicPageContentByKey,
  validatePageData,
};