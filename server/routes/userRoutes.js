const express = require('express');
const router = express.Router();
const { 
    getAllUsers, 
    createUser, 
    updateUser, 
    toggleUserStatus,
    deleteUser,
    getUserProfile
} = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Route get info ca nhan cua nguoi dung hien tai (ap dung cho moi vai tro)
// GET /api/users/profile
router.get('/profile', verifyToken, getUserProfile);

// --- CAC ENDPOINT QUAN TRI account (ADMIN ONLY) ---

// GET /api/users (view danh sach account)
router.get('/', verifyToken, isAdmin, getAllUsers);

// POST /api/users (Tao account moi)
router.post('/', verifyToken, isAdmin, createUser);

// PUT /api/users/:id (update info)
router.put('/:id', verifyToken, isAdmin, updateUser);

// PATCH /api/users/:id/toggle (Khoa/Mo khoa account)
router.patch('/:id/toggle', verifyToken, isAdmin, toggleUserStatus);

// DELETE /api/users/:id (delete account)
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;