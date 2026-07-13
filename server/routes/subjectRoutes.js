const express = require('express');
const router = express.Router();
const { 
    getSubjects, 
    createSubject, 
    updateSubject, 
    deleteSubject 
} = require('../controllers/subjectController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// only cho phep admin access cac API nay
router.use(verifyToken, isAdmin);

// POST http://localhost:5000/api/subjects
router.post('/', createSubject);

// GET http://localhost:5000/api/subjects
router.get('/', getSubjects);

// PUT http://localhost:5000/api/subjects/:id
router.put('/:id', updateSubject);

// DELETE http://localhost:5000/api/subjects/:id
router.delete('/:id', deleteSubject);

module.exports = router;
