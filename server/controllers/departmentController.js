const Department = require('../models/Department');

// get danh sach tat ca cac khoa
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().sort({ departmentName: 1 });
        res.status(200).json(departments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách khoa!', error: error.message });
    }
};

module.exports = {
    getDepartments
};
