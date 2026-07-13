const jwt = require('jsonwebtoken');

// Ham check Token view co hop le khong
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Token gui len tu Frontend thuong co dang: "Bearer <chuoi_token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Giai code token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Gan info giai code duoc (id, role) vao req de cac API sau dung tiep
        next(); // Cho phep di tiep vao controller
    } catch (error) {
        // Exception 3.1: Token expired or invalid
        return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' });
    }
};

// Ham check view co phai Admin khong
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Dung la admin, cho di tiep
    } else {
        return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Admin!' });
    }
};

// Ham check view co phai instructor khong
const isInstructor = (req, res, next) => {
    if (req.user && req.user.role === 'instructor') {
        next(); // Dung la instructor, cho di tiep
    } else {
        return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Giảng viên!' });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isInstructor
};