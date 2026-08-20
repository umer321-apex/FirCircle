const ProgressEntry = require('../models/ProgressEntry');

const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const addProgressEntry = async (req, res) => {
  try {
    const { weightKg, measurements } = req.body;

    // multer parses multipart fields as strings — numbers need explicit parsing
    const parsedWeight = weightKg !== undefined ? parseFloat(weightKg) : undefined;

    let parsedMeasurements;
    if (measurements) {
      try {
        parsedMeasurements = typeof measurements === 'string' ? JSON.parse(measurements) : measurements;
      } catch {
        return res.status(400).json({ message: 'measurements must be valid JSON' });
      }
    }

    if (parsedWeight === undefined && !parsedMeasurements && !req.file) {
      return res.status(400).json({
        message: 'Provide at least one of: weightKg, measurements, or a photo',
      });
    }

    const entry = await ProgressEntry.create({
      userId: req.user._id,
      date: getTodayDateString(),
      weightKg: parsedWeight,
      measurements: parsedMeasurements,
      // req.file.path is the Cloudinary secure_url once multer-storage-cloudinary uploads it —
      // only this URL is persisted, never the raw file
      photoUrl: req.file ? req.file.path : undefined,
    });

    return res.status(201).json({ entry });
  } catch (error) {
    console.error(`[progressController.addProgressEntry] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error saving progress entry' });
  }
};

const getMyProgress = async (req, res) => {
  try {
    const entries = await ProgressEntry.find({ userId: req.user._id })
      .sort({ date: 1 }) // ascending — charts read left-to-right chronologically
      .limit(180)
      .lean();

    return res.status(200).json({ entries });
  } catch (error) {
    console.error(`[progressController.getMyProgress] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching progress' });
  }
};

module.exports = { addProgressEntry, getMyProgress };