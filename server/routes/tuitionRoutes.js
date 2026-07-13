const express = require('express');
const router = express.Router();
const { getMyTuition, getAllTuitions, updatePayment, getMyTuitionActive, syncAllTuitions } = require('../controllers/tuitionController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// only cho phep nguoi dung dang nhap view hoa don tuition cua minh
router.get('/my-tuition', verifyToken, getMyTuition);
router.get('/me', verifyToken, getMyTuitionActive);

// Admin routes
router.get('/', verifyToken, isAdmin, getAllTuitions);
router.put('/:id/payment', verifyToken, isAdmin, updatePayment);
router.post('/sync', verifyToken, isAdmin, syncAllTuitions);

module.exports = router;
