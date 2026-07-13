const User = require('../models/User');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');

// 1. get danh sach tat ca nguoi dung voi phan trang va bo loc role, department
const getAllUsers = async (req, res) => {
    try {
        const { role, department, page = 1, limit = 10 } = req.query;

        // Bo loc theo vai tro va khoa
        const query = {};
        if (role && role !== 'all') {
            query.role = role;
        }
        if (department && department !== 'all') {
            query.department = department;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Dem tong so luong record khop
        const totalUsers = await User.countDocuments(query);

        // get danh sach phan trang (khong tra ve password, populate khoa)
        const users = await User.find(query)
            .select('-password')
            .populate('department')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            users,
            totalPages: Math.ceil(totalUsers / limitNum),
            currentPage: pageNum,
            totalUsers
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng!', error: error.message });
    }
};

// 2. Them nguoi dung moi (code hoa password default "123456")
const createUser = async (req, res) => {
    try {
        const { userId, fullName, email, role, dateOfBirth, managementClass, department } = req.body;

        // Crucial Exception 4.1: check view userId hoac email da ton tai chua
        const userExists = await User.findOne({ $or: [{ email }, { userId }] });
        if (userExists) {
            return res.status(400).json({ message: 'Mã số hoặc Email này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại!' });
        }

        // Tao muoi va code hoa password default la '123456'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const newUser = new User({
            userId,
            fullName,
            email,
            password: hashedPassword,
            role,
            dateOfBirth,
            managementClass: role === 'student' ? managementClass : undefined,
            department: department || undefined,
            isActive: true
        });

        await newUser.save();
        res.status(201).json({ message: 'Tạo tài khoản thành công!', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo tài khoản!', error: error.message });
    }
};

// 3. update info nguoi dung
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, fullName, email, role, dateOfBirth, managementClass, department } = req.body;

        // check view userId hoac email da thuoc ve account khac chua
        const duplicateUser = await User.findOne({
            _id: { $ne: id },
            $or: [{ email }, { userId }]
        });

        if (duplicateUser) {
            return res.status(400).json({ message: 'Mã số hoặc Email này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại!' });
        }

        const updateData = {
            userId,
            fullName,
            email,
            role,
            dateOfBirth,
            managementClass: role === 'student' ? managementClass : null,
            department: department || null
        };

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng cần cập nhật!' });
        }

        res.status(200).json({ message: 'Cập nhật tài khoản thành công!', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật tài khoản!', error: error.message });
    }
};

// 4. Khoa/Mo khoa account (toggleUserStatus)
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Crucial Exception 5.1: Khong duoc tu khoa chinh minh
        if (id === req.user.id) {
            return res.status(403).json({ message: 'Bạn không thể tự khóa hoặc xóa tài khoản của chính mình!' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        }

        if (user.userId === req.user.userId) {
            return res.status(403).json({ message: 'Bạn không thể tự khóa hoặc xóa tài khoản của chính mình!' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({ 
            message: user.isActive ? 'Mở khóa tài khoản thành công!' : 'Khóa tài khoản thành công!', 
            user 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái tài khoản!', error: error.message });
    }
};

// 5. delete nguoi dung (Ngan chan tu delete account cua chinh minh)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Crucial Exception 5.1: Khong duoc tu delete chinh minh
        if (id === req.user.id) {
            return res.status(403).json({ message: 'Bạn không thể tự khóa hoặc xóa tài khoản của chính mình!' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        }

        if (user.userId === req.user.userId) {
            return res.status(403).json({ message: 'Bạn không thể tự khóa hoặc xóa tài khoản của chính mình!' });
        }

        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'Xóa tài khoản thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa tài khoản!', error: error.message });
    }
};

// 6. view info ca nhan (GET /api/users/profile)
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password').populate('department');
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản!' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Không thể tải dữ liệu lúc này, vui lòng thử lại sau.' });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    getUserProfile
};