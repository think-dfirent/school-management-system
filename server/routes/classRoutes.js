const express = require('express');
const router = express.Router();
const {
    getAllClasses,
    getFormData,
    createClass,
    updateClass,
    deleteClass,
    getClassStudents,
    getClassDetails
} = require('../controllers/classController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// GET /api/classes/form-data (get du lieu dropdown cho viec tao lop)
router.get('/form-data', verifyToken, isAdmin, getFormData);

// get details info lop hoc phan (admin hoac instructor in charge)
router.get('/details/:classId', verifyToken, getClassDetails);

// Route danh cho instructor view danh sach student cua lop hoc phan duoc phan cong
// GET /api/classes/:classId/students
router.get('/:classId/students', verifyToken, getClassStudents);

// --- CAC ENDPOINT QUAN TRI LOP HOC PHAN (ADMIN ONLY) ---

// GET /api/classes (view danh sach tat ca lop)
router.get('/', verifyToken, isAdmin, getAllClasses);

// POST /api/classes (Tao lop moi)
router.post('/', verifyToken, isAdmin, createClass);

// PUT /api/classes/:id (Sua lop)
router.put('/:id', verifyToken, isAdmin, updateClass);

// DELETE /api/classes/:id (delete lop)
router.delete('/:id', verifyToken, isAdmin, deleteClass);

module.exports = router;
