const express = require('express');
const router = express.Router();
const { getMyGrades, getClassGrades, bulkUpdateGrades, updateClassGrades } = require('../controllers/gradeController');
const { verifyToken } = require('../middlewares/authMiddleware');

// only cho phep nguoi dung dang nhap view bang diem ca nhan cua minh
router.get('/my-grades', verifyToken, getMyGrades);

// update bang diem hang loat theo chuan structure moi
router.put('/class/update', verifyToken, updateClassGrades);
router.patch('/class/update', verifyToken, updateClassGrades);

// get danh sach diem lop hoc phan (only danh cho instructor day lop do)
router.get('/class/:classId', verifyToken, getClassGrades);

// update bang diem hang loat lop hoc phan (only danh cho instructor day lop do)
router.put('/class/:classId/bulk-update', verifyToken, bulkUpdateGrades);

module.exports = router;
