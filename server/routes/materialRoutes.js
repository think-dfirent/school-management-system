const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { 
    getCourseMaterials, 
    uploadMaterial,
    getMaterialUrl,
    downloadMaterial,
    deleteMaterial,
    getStudentAssignments,
    submitAssignment,
    getStudentMaterials,
    downloadSubmission
} = require('../controllers/materialController');
const { verifyToken, isInstructor } = require('../middlewares/authMiddleware');

// Guard cho hoc vien
const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Học viên!' });
    }
};

// Middleware xu ly va bat loi load file tu Multer
const uploadHandler = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Dung lượng tệp vượt quá giới hạn 50MB!' });
            }
            return res.status(400).json({ message: `Lỗi tải tệp: ${err.message}` });
        }
        next();
    });
};

// ==========================================
// 1. DANH CHO instructor
// ==========================================
// GET /api/materials/:classId - get danh sach materials hoc phan
router.get('/:classId', verifyToken, isInstructor, getCourseMaterials);

// POST /api/materials - load len materials hoac assignments hoc phan
router.post('/', verifyToken, isInstructor, uploadHandler, uploadMaterial);

// DELETE /api/materials/:materialId - delete materials hoc phan
router.delete('/:materialId', verifyToken, isInstructor, deleteMaterial);

// ==========================================
// 2. DANH CHO CA HAI
// ==========================================
// GET /api/materials/presigned-url - get presigned URL theo S3 key (han dung 15 phut)
router.get('/presigned-url', verifyToken, getMaterialUrl);

// GET /api/materials/:materialId/download - check va load xuong materials (quy doi presigned URL tu dong)
router.get('/:materialId/download', verifyToken, downloadMaterial);

// GET /api/materials/submission/:submissionId/download - load bai submit student (quy doi presigned URL tu dong)
router.get('/submission/:submissionId/download', verifyToken, downloadSubmission);

// ==========================================
// 3. DANH CHO HOC VIEN
// ==========================================
// GET /api/materials/student/:classId - get danh sach bai giang/materials cua lop hoc phan
router.get('/student/:classId', verifyToken, isStudent, getStudentMaterials);

// GET /api/materials/student/assignments - get danh sach assignments lon qua query
router.get('/student/assignments', verifyToken, isStudent, getStudentAssignments);

// GET /api/materials/student/:classId/assignments - get danh sach assignments lon va status
router.get('/student/:classId/assignments', verifyToken, isStudent, getStudentAssignments);

// POST /api/materials/submit - submit assignments lon
router.post('/submit', verifyToken, isStudent, uploadHandler, submitAssignment);

module.exports = router;
