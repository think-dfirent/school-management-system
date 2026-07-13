const express = require('express');
const router = express.Router();
const { getAttendanceData, saveAttendance } = require('../controllers/attendanceController');
const { verifyToken, isInstructor } = require('../middlewares/authMiddleware');

// Only allow instructors to take attendance
router.use(verifyToken, isInstructor);

// GET /api/attendance - Get attendance list
router.get('/', getAttendanceData);

// POST /api/attendance - Save/Update attendance information
router.post('/', saveAttendance);

module.exports = router;
