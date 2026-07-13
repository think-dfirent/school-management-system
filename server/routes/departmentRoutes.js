const express = require('express');
const router = express.Router();
const { getDepartments } = require('../controllers/departmentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// GET /api/departments
router.get('/', verifyToken, getDepartments);

module.exports = router;
