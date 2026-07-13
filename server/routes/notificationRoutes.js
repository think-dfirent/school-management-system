const express = require('express');
const router = express.Router();
const {
    getAllNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    getMyNotifications
} = require('../controllers/notificationController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Route get thong bao danh rieng cho nguoi dung hien tai (student / instructor)
// Endpoint: GET /api/notifications/my-notifications
router.get('/my-notifications', verifyToken, getMyNotifications);

// --- CAC ENDPOINT QUAN TRI VIEN (ADMIN ONLY) ---

// GET /api/notifications (view tat ca)
router.get('/', verifyToken, isAdmin, getAllNotifications);

// POST /api/notifications (Tao thong bao)
router.post('/', verifyToken, isAdmin, createNotification);

// PUT /api/notifications/:id (Sua thong bao)
router.put('/:id', verifyToken, isAdmin, updateNotification);

// DELETE /api/notifications/:id (delete thong bao)
router.delete('/:id', verifyToken, isAdmin, deleteNotification);

module.exports = router;
