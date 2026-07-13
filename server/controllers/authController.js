const User = require('../models/User'); // Import User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        // 2. Compare input password with hashed password in database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        // 3. If correct, create JWT Token
        // Pack basic info (id, userId, role) into token
        const payload = { 
            id: user._id,
            userId: user.userId, 
            fullName: user.fullName,
            role: user.role 
        };
        
        // Create 1-day token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        // 4. Return result to Frontend
        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token: token,
            user: {
                id: user._id,
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server!', error: error.message });
    }
};

const seedAdmin = async (req, res) => {
    try {
        // 1. Check if this admin account already exists to avoid duplication
        const adminExists = await User.findOne({ email: 'admin@ptit.edu.vn' });
        if (adminExists) {
            return res.status(400).json({ message: 'Tài khoản Admin đã tồn tại!' });
        }

        // 2. Hash the default password 'admin123'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // 3. Initialize Admin account with standard details
        const admin = new User({
            userId: 'K24DTCN261', 
            fullName: 'Nguyễn Sỹ Cường',
            email: 'admin@ptit.edu.vn',
            password: hashedPassword,
            role: 'admin'
        });

        // 4. Save to Database
        await admin.save();
        
        res.status(201).json({ 
            message: 'Tạo tài khoản Admin gốc thành công!', 
            admin: {
                userId: admin.userId,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khởi tạo', error: error.message });
    }
};

// 3. Change account password (PUT /api/auth/change-password)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const { userId } = req.user; // decodes from token payload

        // 1. Check new password length (Exception 5.1)
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
        }

        // Find user in database
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản!' });
        }

        // 2. Compare current password with hashed password in DB (Exception 6.1)
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại!' });
        }

        // 3. Hash new password and save
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu!', error: error.message });
    }
};

module.exports = { login, seedAdmin, changePassword };