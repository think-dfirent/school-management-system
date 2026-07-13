const express = require('express');
const router = express.Router();
const { getMySchedule, getTeachingSchedule } = require('../controllers/scheduleController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route schedule hoc ca nhan cua student
router.get('/my-schedule', verifyToken, getMySchedule);

// Route schedule teaching cua instructor
router.get('/teaching-schedule', verifyToken, getTeachingSchedule);

module.exports = router;
