import express from 'express';
import EventLog from '../models/EventLog.js';

const router = express.Router();

// Get all event logs with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      eventType, 
      videoId, 
      success,
      startDate,
      endDate 
    } = req.query;

    const filter = {};
    
    if (eventType) filter.eventType = eventType;
    if (videoId) filter.videoId = videoId;
    if (success !== undefined) filter.success = success === 'true';
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: 'noteId'
    };

    const logs = await EventLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('noteId');

    const total = await EventLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event logs',
      error: error.message
    });
  }
});

// Get event log statistics
router.get('/stats', async (req, res) => {
  try {
    const { videoId, days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const filter = {
      createdAt: { $gte: startDate }
    };
    
    if (videoId) filter.videoId = videoId;

    const stats = await EventLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: ['$success', 1, 0] }
          },
          errorCount: {
            $sum: { $cond: ['$success', 0, 1] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalEvents = await EventLog.countDocuments(filter);
    const successfulEvents = await EventLog.countDocuments({ ...filter, success: true });
    const failedEvents = await EventLog.countDocuments({ ...filter, success: false });

    res.json({
      success: true,
      data: {
        totalEvents,
        successfulEvents,
        failedEvents,
        successRate: totalEvents > 0 ? (successfulEvents / totalEvents * 100).toFixed(2) : 0,
        eventTypes: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event statistics',
      error: error.message
    });
  }
});

// Get recent activity
router.get('/recent/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 10 } = req.query;

    const recentLogs = await EventLog.find({ videoId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('noteId');

    res.json({
      success: true,
      data: recentLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
});

export default router;
