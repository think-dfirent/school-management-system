const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// GET /api/rooms (get danh sach tat ca room hoc)
router.get('/', verifyToken, async (req, res) => {
    try {
        const rooms = await Room.find().sort({ roomId: 1 });
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách phòng học!', error: error.message });
    }
});

// POST /api/rooms (Tao room hoc moi)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { roomId, capacity, roomType } = req.body;
        const roomExists = await Room.findOne({ roomId });
        if (roomExists) {
            return res.status(400).json({ message: 'Mã phòng học đã tồn tại.' });
        }
        const newRoom = new Room({ roomId, capacity, roomType });
        await newRoom.save();
        res.status(201).json({ message: 'Tạo phòng học thành công', room: newRoom });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo phòng học!', error: error.message });
    }
});

module.exports = router;
