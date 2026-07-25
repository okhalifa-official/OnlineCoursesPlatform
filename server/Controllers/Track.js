const Track = require("../Models/Track");
const Course = require("../Models/course");
const { slugify } = require("../utils/slug");

async function buildUniqueSlug(name, excludeId) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  for (;;) {
    const query = excludeId
      ? { slug: candidate, _id: { $ne: excludeId } }
      : { slug: candidate };

    const collision = await Track.findOne(query);

    if (!collision) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

const getTracks = async function (req, res) {
  try {
    const [tracks, counts] = await Promise.all([
      Track.find({}).sort({ name: 1 }).lean(),
      Course.aggregate([
        { $group: { _id: "$trackId", count: { $sum: 1 } } },
      ]),
    ]);

    const countsByTrack = new Map(
      counts.map((row) => [String(row._id), row.count])
    );

    const enriched = tracks.map((track) => ({
      ...track,
      courseCount: countsByTrack.get(String(track._id)) || 0,
    }));

    return res.status(200).json(enriched);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get tracks",
      error: error.message,
    });
  }
};

const createTrack = async function (req, res) {
  try {
    const { name, description, color } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Track name is required" });
    }

    const slug = await buildUniqueSlug(name);

    const track = await Track.create({
      name: String(name).trim(),
      slug,
      description: description || "",
      color: color || "#D62828",
    });

    return res.status(201).json(track);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A track with this name already exists",
      });
    }

    return res.status(400).json({
      message: "Failed to create track",
      error: error.message,
    });
  }
};

const updateTrack = async function (req, res) {
  try {
    const { name, description, color } = req.body || {};

    const existing = await Track.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Track not found" });
    }

    const update = {
      description: description ?? existing.description,
      color: color || existing.color,
    };

    if (name && name.trim() && name.trim() !== existing.name) {
      update.name = name.trim();
      update.slug = await buildUniqueSlug(name, existing._id);
    }

    const track = await Track.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(track);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A track with this name already exists",
      });
    }

    return res.status(400).json({
      message: "Failed to update track",
      error: error.message,
    });
  }
};

const deleteTrack = async function (req, res) {
  try {
    const courseCount = await Course.countDocuments({
      trackId: req.params.id,
    });

    if (courseCount > 0) {
      return res.status(409).json({
        message: `Cannot delete a track with ${courseCount} course(s) still assigned to it. Reassign or remove those courses first.`,
      });
    }

    const track = await Track.findByIdAndDelete(req.params.id);

    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    return res.status(200).json({ message: "Track deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete track",
      error: error.message,
    });
  }
};

module.exports = {
  buildUniqueSlug,
  getTracks,
  createTrack,
  updateTrack,
  deleteTrack,
};
