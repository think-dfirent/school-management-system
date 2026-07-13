const express = require('express');
const router = express.Router();
const { 
    getAdminRequests, 
    processRequest,
    getInstructorRequests,
    processInstructorRequest,
    getEnrolledClassesForSupport,
    createSupportRequest,
    getMySupportRequests,
    updateSupportRequest,
    deleteSupportRequest
} = require('../controllers/supportController');
const { verifyToken, isAdmin, isInstructor } = require('../middlewares/authMiddleware');

// Guard cho hoc vien
const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Học viên!' });
    }
};

// Tat ca endpoints quan ly request support request dang nhap
router.use(verifyToken);

// ==========================================
// 1. DANH CHO ADMIN
// ==========================================
// GET /api/support/admin - get danh sach request support gui den Admin
router.get('/admin', isAdmin, getAdminRequests);

// PUT /api/support/:id - Admin xu ly feedback request support
router.put('/:id', isAdmin, processRequest);

// ==========================================
// 2. DANH CHO instructor
// ==========================================
// GET /api/support/instructor - get danh sach request support gui den instructor
router.get('/instructor', isInstructor, getInstructorRequests);

// PUT /api/support/instructor/:id - instructor xu ly feedback request support
router.put('/instructor/:id', isInstructor, processInstructorRequest);

// ==========================================
// 3. DANH CHO HOC VIEN
// ==========================================
// GET /api/support/my-enrolled-classes - get danh sach lop hoc de chon khi gui request support
router.get('/my-enrolled-classes', isStudent, getEnrolledClassesForSupport);

// POST /api/support/student - Hoc vien gui request support moi
router.post('/student', isStudent, createSupportRequest);

// GET /api/support/me - get schedule su request support cua hoc vien
router.get('/me', isStudent, getMySupportRequests);

// PUT /api/support/student/:id - Hoc vien sua request support
router.put('/student/:id', isStudent, updateSupportRequest);

// DELETE /api/support/student/:id - Hoc vien delete request support
router.delete('/student/:id', isStudent, deleteSupportRequest);

module.exports = router;
