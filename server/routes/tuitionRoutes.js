const express = require('express');
const router = express.Router();
const { getMyTuition } = require('../controllers/tuitionController');
const { verifyToken } = require('../middlewares/authMiddleware');

// only cho phep nguoi dung dang nhap view hoa don tuition cua minh
router.get('/my-tuition', verifyToken, getMyTuition);

module.exports = router;
