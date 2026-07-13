const User = require('../models/User');
const Class = require('../models/Class');
const Tuition = require('../models/Tuition');
const Semester = require('../models/Semester');
const Enrollment = require('../models/Enrollment');
const Department = require('../models/Department');

// get so lieu thong ke system (GET /api/dashboard/stats)
const getDashboardStats = async (req, res) => {
    try {
        // 1. Tim semester dang dien ra (isActive: true)
        const activeSemester = await Semester.findOne({ isActive: true });

        // 2. Chay song song cac cau lenh truy van bang Promise.all de toi uu hoa hieu nang
        const [
            totalStudents,
            totalInstructors,
            openClasses,
            revenueResult,
            studentsByDepartment,
            gradeDistribution
        ] = await Promise.all([
            // Dem tong so student
            User.countDocuments({ role: 'student' }),

            // Dem tong so instructor
            User.countDocuments({ role: 'instructor' }),

            // Dem so lop hoc phan dang active thuoc semester active
            Class.countDocuments(activeSemester ? { semester: activeSemester._id } : {}),

            // Tinh tong doanh thu tuition da thu
            Tuition.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$paidAmount' }
                    }
                }
            ]),

            // Thong ke student theo khoa (lookup sang departments)
            User.aggregate([
                { $match: { role: 'student' } },
                { $group: { _id: '$department', count: { $sum: 1 } } },
                {
                    $lookup: {
                        from: 'departments',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'deptInfo'
                    }
                },
                { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        departmentName: { $ifNull: ['$deptInfo.departmentName', 'Chưa xếp khoa'] },
                        count: 1
                    }
                }
            ]),

            // Thong ke phan bo diem chu (A, B, C, D, F) tu enrollments
            Enrollment.aggregate([
                {
                    $match: {
                        $or: [
                            { 'grades.letterGrade': { $ne: null } },
                            { 'letterGrade': { $ne: null } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: { $ifNull: ['$grades.letterGrade', '$letterGrade'] },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        letterGrade: '$_id',
                        count: 1
                    }
                },
                { $sort: { letterGrade: 1 } }
            ])
        ]);

        const totalRevenue = (revenueResult.length > 0) ? revenueResult[0].totalRevenue : 0;

        res.status(200).json({
            totalStudents: totalStudents || 0,
            totalInstructors: totalInstructors || 0,
            openClasses: openClasses || 0,
            totalRevenue: totalRevenue || 0,
            studentsByDepartment: studentsByDepartment || [],
            gradeDistribution: gradeDistribution || []
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tính toán số liệu thống kê!', error: error.message });
    }
};

module.exports = {
    getDashboardStats
};
