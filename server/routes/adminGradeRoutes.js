const express = require('express');
const router = express.Router();
const { getAdminGrades, updateAdminGrade } = require('../controllers/adminGradeController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// GET /api/admin/grades - View all student grades
router.get('/', verifyToken, isAdmin, getAdminGrades);

// PUT /api/admin/grades/:enrollmentId - Update single student grade record
router.put('/:enrollmentId', verifyToken, isAdmin, updateAdminGrade);

module.exports = router;
