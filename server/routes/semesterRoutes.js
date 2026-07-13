const express = require('express');
const router = express.Router();
const { getSemesters, createSemester, updateSemester } = require('../controllers/semesterController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// GET /api/semesters - view danh sach semester
router.get('/', verifyToken, getSemesters);

// POST /api/semesters - Tao semester moi
router.post('/', verifyToken, isAdmin, createSemester);

// PUT /api/semesters/:id - update semester
router.put('/:id', verifyToken, isAdmin, updateSemester);

module.exports = router;
