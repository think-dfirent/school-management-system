const express = require('express');
const router = express.Router();
const { getSemesters, createSemester, updateSemester } = require('../controllers/semesterController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Tat ca endpoints quan ly semester request quyen Admin
router.use(verifyToken);
router.use(isAdmin);

// GET /api/semesters - view danh sach semester
router.get('/', getSemesters);

// POST /api/semesters - Tao semester moi
router.post('/', createSemester);

// PUT /api/semesters/:id - update semester
router.put('/:id', updateSemester);

module.exports = router;
