const express = require('express');
const router = express.Router();
const { login, seedAdmin, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route Dang nhap
// Duong dan thuc te se la: POST http://localhost:5000/api/auth/login
router.post('/login', login);

router.post('/seed-admin', seedAdmin);

// Route Doi password (ap dung cho moi actor, request dang nhap)
router.put('/change-password', verifyToken, changePassword);

module.exports = router;