const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Route thong ke so lieu (only cho phep Admin access)
router.get('/stats', verifyToken, isAdmin, getDashboardStats);

module.exports = router;
