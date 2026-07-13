const express = require('express');
const router = express.Router();
const { 
    getRegistrationData, 
    registerClass,
    enrollClass, 
    getAvailableClasses,
    cancelRegistration
} = require('../controllers/registrationController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Tat ca endpoints register credits request dang nhap account student
router.use(verifyToken);

// GET /api/registrations - get du lieu register credits (semester active, lop mo, lop da register)
router.get('/', getRegistrationData);

// POST /api/registrations - perform gui request register subject
router.post('/', registerClass);

// DELETE /api/registrations/:classId - Huy register lop hoc phan
router.delete('/:classId', cancelRegistration);

// GET /api/registrations/available - (Alias cu) get danh sach lop HP de chon register
router.get('/available', getAvailableClasses);

// POST /api/registrations/enroll - (Alias cu) perform gui request register subject
router.post('/enroll', enrollClass);

module.exports = router;
