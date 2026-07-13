const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');

// 1. get schedule hoc ca nhan cua student (GET /api/schedules/my-schedule)
const getMySchedule = async (req, res) => {
    try {
        const studentId = req.user.id; // get ObjectId cua student tu token

        // Tim tat ca cac lop hoc phan student nay da register
        const enrollments = await Enrollment.find({ student: studentId })
            .populate({
                path: 'class',
                populate: [
                    { path: 'subject', select: 'subjectName subjectId' },
                    { path: 'instructor', select: 'fullName' },
                    { path: 'semester', select: 'semesterName' }
                ]
            });

        // format lai structure tra ve cho gon gang hon
        const scheduleList = enrollments
            .map(e => e.class)
            .filter(c => c !== null); // remove cac lien ket bi hong neu co

        res.status(200).json(scheduleList);

    } catch (error) {
        // Exception 4.1: Server Error
        res.status(500).json({ 
            message: 'Lỗi kết nối dữ liệu. Vui lòng thử lại sau!',
            error: error.message 
        });
    }
};

// 2. get schedule teaching cua instructor (GET /api/schedules/teaching-schedule)
const getTeachingSchedule = async (req, res) => {
    try {
        const instructorId = req.user.id; // get ObjectId cua instructor tu token
        const role = req.user.role;

        // only cho phep instructor hoac admin access
        if (role !== 'instructor' && role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối! Chỉ giảng viên mới xem được lịch giảng dạy.' });
        }

        // Tim tat ca lop hoc phan instructor nay direct in charge teaching
        const classes = await Class.find({ instructor: instructorId })
            .populate('subject', 'subjectName subjectId credits')
            .populate('semester', 'semesterName')
            .sort({ classId: 1 });

        res.status(200).json(classes);

    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi server khi truy xuất lịch giảng dạy!',
            error: error.message 
        });
    }
};

module.exports = {
    getMySchedule,
    getTeachingSchedule
};
