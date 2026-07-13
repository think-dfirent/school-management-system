const Notification = require('../models/Notification');

// 1. get danh sach tat ca thong bao (sort giam dan theo time tao)
const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('author', 'fullName userId')
            .sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        // Exception 7.1: Server Error Handling
        res.status(500).json({ 
            message: 'Lỗi máy chủ, không thể phát hành thông báo lúc này. Vui lòng thử lại sau!',
            error: error.message 
        });
    }
};

// 2. Tao thong bao moi
const createNotification = async (req, res) => {
    try {
        const { title, content, targetAudience } = req.body;
        const author = req.user.id; // get ID cua Admin tu token da xac thuc

        const newNotification = new Notification({
            title,
            content,
            targetAudience,
            author
        });

        await newNotification.save();
        res.status(201).json({ message: 'Đã phát hành thông báo mới', notification: newNotification });
    } catch (error) {
        // Exception 7.1: Server Error Handling
        res.status(500).json({ 
            message: 'Lỗi máy chủ, không thể phát hành thông báo lúc này. Vui lòng thử lại sau!',
            error: error.message 
        });
    }
};

// 3. update thong bao
const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, targetAudience } = req.body;

        const updatedNotification = await Notification.findByIdAndUpdate(
            id,
            { title, content, targetAudience },
            { new: true, runValidators: true }
        );

        if (!updatedNotification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo cần cập nhật!' });
        }

        res.status(200).json({ message: 'Cập nhật thông báo thành công!', notification: updatedNotification });
    } catch (error) {
        // Exception 7.1: Server Error Handling
        res.status(500).json({ 
            message: 'Lỗi máy chủ, không thể phát hành thông báo lúc này. Vui lòng thử lại sau!',
            error: error.message 
        });
    }
};

// 4. delete thong bao
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedNotification = await Notification.findByIdAndDelete(id);
        if (!deletedNotification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo cần xóa!' });
        }

        res.status(200).json({ message: 'Xóa thông báo thành công!' });
    } catch (error) {
        // Exception 7.1: Server Error Handling
        res.status(500).json({ 
            message: 'Lỗi máy chủ, không thể phát hành thông báo lúc này. Vui lòng thử lại sau!',
            error: error.message 
        });
    }
};

// 5. get danh sach thong bao danh cho student / instructor (dua tren vai tro)
const getMyNotifications = async (req, res) => {
    try {
        const userRole = req.user.role; // 'student' hoac 'instructor' hoac 'admin'

        // Tim cac thong bao huong toi 'all' hoac vai tro hien tai cua nguoi dung
        const notifications = await Notification.find({
            targetAudience: { $in: ['all', userRole] }
        })
        .populate('author', 'fullName userId')
        .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        // Exception 7.1: Server Error Handling
        res.status(500).json({ 
            message: 'Lỗi máy chủ, không thể phát hành thông báo lúc này. Vui lòng thử lại sau!',
            error: error.message 
        });
    }
};

module.exports = {
    getAllNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    getMyNotifications
};
