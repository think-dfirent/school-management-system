const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');

// 1. Get attendance info (GET /api/attendance)
const getAttendanceData = async (req, res) => {
    try {
        const { classId, sessionNumber } = req.query;
        if (!classId || !sessionNumber) {
            return res.status(400).json({ message: 'Thiếu classId hoặc sessionNumber!' });
        }

        // Get list of students enrolled in this class
        const enrollments = await Enrollment.find({ class: classId })
            .populate('student', 'fullName userId email')
            .sort({ 'student.userId': 1 });

        // Find existing attendance record
        const attendance = await Attendance.findOne({ class: classId, sessionNumber: parseInt(sessionNumber) });

        // Map to attach attendance score from enrollment
        const studentsMapped = enrollments.map(e => {
            if (!e.student) return null;
            const stObj = e.student.toObject ? e.student.toObject() : { ...e.student };
            stObj.attendanceScore = e.grades?.attendance !== null && e.grades?.attendance !== undefined 
                ? e.grades.attendance 
                : (e.attendanceScore !== null ? e.attendanceScore : 10.0);
            return stObj;
        }).filter(s => s !== null);

        res.status(200).json({
            students: studentsMapped,
            attendance: attendance || null
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu điểm danh!', error: error.message });
    }
};

// 2. Save attendance (POST /api/attendance)
const saveAttendance = async (req, res) => {
    try {
        const { classId, sessionNumber, actualDate, records } = req.body;
        if (!classId || !sessionNumber || !actualDate || !records) {
            return res.status(400).json({ message: 'Thiếu thông tin lưu điểm danh!' });
        }

        const reqDate = new Date(actualDate);
        const today = new Date();
        reqDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Validation (Exception 2.1): Future date not allowed for attendance
        if (reqDate > today) {
            return res.status(400).json({ message: 'Không thể điểm danh cho buổi học chưa diễn ra!' });
        }

        // Save or update attendance record
        await Attendance.findOneAndUpdate(
            { class: classId, sessionNumber: parseInt(sessionNumber) },
            { class: classId, sessionNumber: parseInt(sessionNumber), date: reqDate, records },
            { new: true, upsert: true }
        );

        // AUTOMATICALLY RECALCULATE ATTENDANCE SCORE FOR ALL STUDENTS IN THE CLASS (Post-Condition)
        const allAttendances = await Attendance.find({ class: classId });
        const totalSessions = allAttendances.length;
        const enrollments = await Enrollment.find({ class: classId });

        for (const enrollment of enrollments) {
            let sumPoints = 0;

            allAttendances.forEach(att => {
                const record = att.records.find(r => r.student.toString() === enrollment.student.toString());
                if (record) {
                    if (record.status === 'present') {
                        sumPoints += 10;
                    } else if (record.status === 'excused') {
                        sumPoints += 5;
                    } else if (record.status === 'absent') {
                        sumPoints += 0;
                    }
                } else {
                    // If student has no record for this session, count as 0
                    sumPoints += 0;
                }
            });

            const sessionsCount = totalSessions || 1;
            const calculated = sumPoints / sessionsCount;
            const newAttendanceGrade = Math.round(calculated * 10) / 10;

            // Update student attendance score
            enrollment.attendanceScore = newAttendanceGrade;
            if (!enrollment.grades) {
                enrollment.grades = {};
            }
            enrollment.grades.attendance = newAttendanceGrade;

            // Get exam grades and calculate final score
            const midtermVal = enrollment.grades?.midterm !== null && enrollment.grades?.midterm !== undefined 
                ? enrollment.grades.midterm 
                : enrollment.midtermScore;
            
            const finalVal = enrollment.grades?.final !== null && enrollment.grades?.final !== undefined 
                ? enrollment.grades.final 
                : enrollment.finalScore;

            if (midtermVal !== null && finalVal !== null) {
                const total = (newAttendanceGrade * 0.1) + (midtermVal * 0.2) + (finalVal * 0.7);
                const roundedTotal = Math.round(total * 10) / 10;
                
                enrollment.totalScore = roundedTotal;
                enrollment.grades.total = roundedTotal;

                // Letter grade classification
                let letter = 'F';
                if (roundedTotal >= 8.5) letter = 'A';
                else if (roundedTotal >= 7.0) letter = 'B';
                else if (roundedTotal >= 5.5) letter = 'C';
                else if (roundedTotal >= 4.0) letter = 'D';

                enrollment.letterGrade = letter;
                enrollment.grades.letterGrade = letter;
                enrollment.status = roundedTotal >= 4.0 ? 'Đạt' : 'Không đạt';
            }

            await enrollment.save();
        }

        res.status(200).json({ message: 'Lưu điểm danh thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lưu điểm danh!', error: error.message });
    }
};

module.exports = {
    getAttendanceData,
    saveAttendance
};
