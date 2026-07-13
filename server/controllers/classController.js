const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Semester = require('../models/Semester');
const Room = require('../models/Room');
const mongoose = require('mongoose');

// 1. Get list of all classes (fully populated)
const getAllClasses = async (req, res) => {
    try {
        if (req.user && req.user.role === 'student') {
            const activeSemester = await Semester.findOne({ isActive: true });
            if (!activeSemester) {
                return res.status(200).json([]);
            }
            const classes = await Class.find({ semester: activeSemester._id })
                .populate('subject', 'subjectName subjectId')
                .populate('instructor', 'fullName userId')
                .populate('semester', 'semesterName')
                .populate('schedules.room')
                .sort({ createdAt: -1 });
            return res.status(200).json(classes);
        }

        const classes = await Class.find()
            .populate('subject', 'subjectName subjectId')
            .populate('instructor', 'fullName userId')
            .populate('semester', 'semesterName')
            .populate('schedules.room')
            .sort({ createdAt: -1 });
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách lớp học phần!', error: error.message });
    }
};

// 1.5. Get class creation dropdown data (Subject, Instructor, Semester, Room)
const getFormData = async (req, res) => {
    try {
        // Get all subjects, sorted by name
        const subjects = await Subject.find().sort({ subjectName: 1 });
        // Get all instructors, sorted by name
        const lecturers = await User.find({ role: 'instructor' }).select('-password').sort({ fullName: 1 });
        // Get all semesters, sorted by latest registration time
        const semesters = await Semester.find().sort({ registrationStartDate: -1 });
        // Get all rooms, sorted by room ID
        const rooms = await Room.find().sort({ roomId: 1 });

        res.status(200).json({
            subjects,
            lecturers,
            semesters,
            rooms
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu form!', error: error.message });
    }
};

// 2. Create new class (Check instructor & room schedule duplicates)
const createClass = async (req, res) => {
    try {
        const { classId, subject, instructor, semester, startDate, endDate, schedules, maxStudents } = req.body;

        // Check if classId already exists
        const classExists = await Class.findOne({ classId });
        if (classExists) {
            return res.status(400).json({ message: 'Mã lớp học phần này đã tồn tại trên hệ thống.' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ngày bắt đầu và kết thúc của lớp học phần!' });
        }

        const semesterDoc = await Semester.findById(semester);
        if (!semesterDoc) return res.status(404).json({ message: 'Không tìm thấy học kỳ.' });

        const classStart = new Date(startDate);
        const classEnd = new Date(endDate);
        
        if (classStart < semesterDoc.startDate || classEnd > semesterDoc.endDate) {
            return res.status(400).json({ 
                message: `Thời gian lớp học phần phải nằm trong giới hạn của học kỳ (Từ ${semesterDoc.startDate.toLocaleDateString('vi-VN')} đến ${semesterDoc.endDate.toLocaleDateString('vi-VN')}).` 
            });
        }

        // Check instructor & room schedule conflicts using $elemMatch
        for (const newSched of schedules) {
            // Constraint 1 (Room validation): Check room exists
            const roomDoc = await Room.findById(newSched.room);
            if (!roomDoc) {
                return res.status(400).json({ message: 'Không tìm thấy phòng học đã chọn!' });
            }

            // Condition A: Instructor schedule conflict
            const instructorConflict = await Class.findOne({
                semester,
                instructor,
                schedules: {
                    $elemMatch: {
                        dayOfWeek: newSched.dayOfWeek,
                        startPeriod: { $lte: newSched.endPeriod },
                        endPeriod: { $gte: newSched.startPeriod }
                    }
                }
            });

            if (instructorConflict) {
                return res.status(400).json({ 
                    message: `Giảng viên này đã kẹt lịch vào thứ ${newSched.dayOfWeek} (Tiết ${newSched.startPeriod}-${newSched.endPeriod}).` 
                });
            }

            // Constraint 2 (Double Booking): Check room schedule conflict
            const roomConflict = await Class.findOne({
                semester,
                schedules: {
                    $elemMatch: {
                        room: newSched.room,
                        dayOfWeek: newSched.dayOfWeek,
                        startPeriod: { $lte: newSched.endPeriod },
                        endPeriod: { $gte: newSched.startPeriod }
                    }
                }
            });

            if (roomConflict) {
                return res.status(400).json({ 
                    message: 'Phòng học này đã bị kịch lịch vào thời gian đã chọn.' 
                });
            }
        }

        // Load first room info to save as flat room code (backward compatibility)
        const firstRoomDoc = await Room.findById(schedules[0]?.room);
        const flatRoom = firstRoomDoc ? firstRoomDoc.roomId : '';

        // Create new class
        const newClass = new Class({
            classId,
            subject,
            instructor,
            semester,
            startDate,
            endDate,
            schedules,
            room: flatRoom,
            maxStudents,
            currentStudents: 0
        });

        await newClass.save();
        res.status(201).json({ message: 'Mở lớp thành công', class: newClass });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo lớp học phần!', error: error.message });
    }
};

// 3. Update class (Check conflicts and exclude itself)
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { classId, subject, instructor, semester, startDate, endDate, schedules, maxStudents } = req.body;

        // check view classId duplicate voi lop khac khong
        const duplicateClass = await Class.findOne({ classId, _id: { $ne: id } });
        if (duplicateClass) {
            return res.status(400).json({ message: 'Mã lớp học phần này đã tồn tại trên hệ thống.' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ngày bắt đầu và kết thúc của lớp học phần!' });
        }

        const semesterDoc = await Semester.findById(semester);
        if (!semesterDoc) return res.status(404).json({ message: 'Không tìm thấy học kỳ.' });

        const classStart = new Date(startDate);
        const classEnd = new Date(endDate);
        
        if (classStart < semesterDoc.startDate || classEnd > semesterDoc.endDate) {
            return res.status(400).json({ 
                message: `Thời gian lớp học phần phải nằm trong giới hạn của học kỳ (Từ ${semesterDoc.startDate.toLocaleDateString('vi-VN')} đến ${semesterDoc.endDate.toLocaleDateString('vi-VN')}).` 
            });
        }

        // Check instructor & room schedule conflicts using $elemMatch (ngoai tru lop hien tai)
        for (const newSched of schedules) {
            // Constraint 1 (Room validation): Check room exists
            const roomDoc = await Room.findById(newSched.room);
            if (!roomDoc) {
                return res.status(400).json({ message: 'Không tìm thấy phòng học đã chọn!' });
            }

            // Instructor schedule conflict
            const instructorConflict = await Class.findOne({
                _id: { $ne: id },
                semester,
                instructor,
                schedules: {
                    $elemMatch: {
                        dayOfWeek: newSched.dayOfWeek,
                        startPeriod: { $lte: newSched.endPeriod },
                        endPeriod: { $gte: newSched.startPeriod }
                    }
                }
            });

            if (instructorConflict) {
                return res.status(400).json({ 
                    message: `Giảng viên này đã kẹt lịch vào thứ ${newSched.dayOfWeek} (Tiết ${newSched.startPeriod}-${newSched.endPeriod}).` 
                });
            }

            // Constraint 2 (Double Booking): Check room schedule conflict
            const roomConflict = await Class.findOne({
                _id: { $ne: id },
                semester,
                schedules: {
                    $elemMatch: {
                        room: newSched.room,
                        dayOfWeek: newSched.dayOfWeek,
                        startPeriod: { $lte: newSched.endPeriod },
                        endPeriod: { $gte: newSched.startPeriod }
                    }
                }
            });

            if (roomConflict) {
                return res.status(400).json({ 
                    message: 'Phòng học này đã bị kịch lịch vào thời gian đã chọn.' 
                });
            }
        }

        const firstRoomDoc = await Room.findById(schedules[0]?.room);
        const flatRoom = firstRoomDoc ? firstRoomDoc.roomId : '';

        const updatedClass = await Class.findByIdAndUpdate(
            id,
            { 
                classId, 
                subject, 
                instructor, 
                semester, 
                startDate, 
                endDate, 
                schedules, 
                room: flatRoom, 
                maxStudents 
            },
            { new: true, runValidators: true }
        );

        if (!updatedClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học phần cần cập nhật!' });
        }

        res.status(200).json({ message: 'Cập nhật thông tin lớp học phần thành công!', class: updatedClass });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật lớp học phần!', error: error.message });
    }
};


// 4. delete lop hoc phan
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedClass = await Class.findByIdAndDelete(id);
        if (!deletedClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học phần cần xóa!' });
        }

        res.status(200).json({ message: 'Xóa lớp học phần thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa lớp học phần!', error: error.message });
    }
};

// 5. get danh sach student cua lop hoc phan (check IDOR - only instructor in charge duoc view)
const getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        const instructorId = req.user.id; // decodes to user._id

        // Tim lop hoc phan
        const query = mongoose.isValidObjectId(classId)
            ? { _id: classId }
            : { classId: classId };

        const classObj = await Class.findOne(query);
        if (!classObj) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học phần!' });
        }

        // Crucial Security Check (Exception 3.1 - IDOR Prevention)
        if (classObj.instructor.toString() !== instructorId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bạn không có quyền xem danh sách của lớp học phần này.' });
        }

        // get toan bo student da register hoc lop nay
        const enrollments = await Enrollment.find({ class: classObj._id })
            .populate('student', 'userId fullName dateOfBirth email')
            .sort({ 'student.userId': 1 });

        // Tra ve danh sach student
        res.status(200).json(enrollments);

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sinh viên!', error: error.message });
    }
};

// 6. get details info lop hoc phan (Admin hoac instructor day lop do)
const getClassDetails = async (req, res) => {
    try {
        const { classId } = req.params;
        const query = mongoose.isValidObjectId(classId)
            ? { _id: classId }
            : { classId: classId };

        const classObj = await Class.findOne(query)
            .populate('subject', 'subjectName subjectId credits')
            .populate('instructor', 'fullName email')
            .populate('semester', 'semesterName startDate endDate')
            .populate('schedules.room');

        if (!classObj) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học phần!' });
        }

        // Quyen access: only admin, instructor in charge hoac hoc vien register lop nay
        const isInstructorOfClass = classObj.instructor._id.toString() === req.user.id;
        const isStudentEnrolled = req.user.role === 'student' && (await Enrollment.exists({ class: classObj._id, student: req.user.id }));

        if (req.user.role !== 'admin' && !isInstructorOfClass && !isStudentEnrolled) {
            return res.status(403).json({ message: 'Bạn không có quyền xem thông tin lớp học phần này!' });
        }

        res.status(200).json(classObj);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết lớp học phần!', error: error.message });
    }
};

module.exports = {
    getAllClasses,
    getFormData,
    createClass,
    updateClass,
    deleteClass,
    getClassStudents,
    getClassDetails
};
