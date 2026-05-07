const SystemSettings = require("../Models/SystemSettings");

async function getOrCreateSystemSettings() {
  let settings = await SystemSettings.findOne();

  if (!settings) {
    settings = await SystemSettings.create({});
  }

  return settings;
}

const getSettings = async function (req, res) {
  try {
    const settings = await getOrCreateSystemSettings();

    return res.status(200).json(settings);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get settings",
      error: error.message,
    });
  }
};

const updateGeneralSettings = async function (req, res) {
  try {
    const currentSettings = await getOrCreateSystemSettings();

    const updatedSettings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        platformName: req.body.platformName,
        platformLanguage: req.body.platformLanguage,
        platformDescription: req.body.platformDescription,
        logoUrl: req.body.logoUrl,
        updatedBy: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.locals.auditTarget = "General Settings";
    res.locals.auditPayload = {
      platformName: updatedSettings.platformName,
      platformLanguage: updatedSettings.platformLanguage,
      platformDescription: updatedSettings.platformDescription,
      logoUrl: updatedSettings.logoUrl,
    };

    return res.status(200).json(updatedSettings);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update general settings",
      error: error.message,
    });
  }
};

const updateSecuritySettings = async function (req, res) {
  try {
    const currentSettings = await getOrCreateSystemSettings();

    const updatedSettings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        twoFactorEnabled: Boolean(req.body.twoFactorEnabled),
        sessionTimeout: req.body.sessionTimeout || currentSettings.sessionTimeout,
        updatedBy: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.locals.auditTarget = "Security Settings";
    res.locals.auditPayload = {
      twoFactorEnabled: updatedSettings.twoFactorEnabled,
      sessionTimeout: updatedSettings.sessionTimeout,
    };

    return res.status(200).json(updatedSettings);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update security settings",
      error: error.message,
    });
  }
};

const updateNotificationSettings = async function (req, res) {
  try {
    const currentSettings = await getOrCreateSystemSettings();

    const updatedSettings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        emailAlerts: Boolean(req.body.emailAlerts),
        smsNotifications: Boolean(req.body.smsNotifications),
        systemAlerts: Boolean(req.body.systemAlerts),
        updatedBy: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.locals.auditTarget = "Notification Settings";
    res.locals.auditPayload = {
      emailAlerts: updatedSettings.emailAlerts,
      smsNotifications: updatedSettings.smsNotifications,
      systemAlerts: updatedSettings.systemAlerts,
    };

    return res.status(200).json(updatedSettings);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update notification settings",
      error: error.message,
    });
  }
};

const manualBackup = async function (req, res) {
  try {
    const currentSettings = await getOrCreateSystemSettings();

    const updatedSettings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        lastBackupAt: new Date(),
        updatedBy: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.locals.auditTarget = "Manual Backup";
    res.locals.auditPayload = {
      lastBackupAt: updatedSettings.lastBackupAt,
    };

    return res.status(200).json({
      message: "Manual backup started successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to start manual backup",
      error: error.message,
    });
  }
};

const restoreData = async function (req, res) {
  try {
    const currentSettings = await getOrCreateSystemSettings();

    const updatedSettings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        lastRestoreAt: new Date(),
        updatedBy: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.locals.auditTarget = "Restore Data";
    res.locals.auditPayload = {
      lastRestoreAt: updatedSettings.lastRestoreAt,
    };

    return res.status(200).json({
      message: "Restore process started successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to start restore process",
      error: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateGeneralSettings,
  updateSecuritySettings,
  updateNotificationSettings,
  manualBackup,
  restoreData,
};