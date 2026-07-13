const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const mongoose = require('mongoose');

// get danh sach diem va GPA cua student (GET /api/grades/my-grades)
const getMyGrades = async (req, res) => {
    try {
        const studentId = req.user.id; // get ObjectId cua student tu token

        const enrollments = await Enrollment.find({ student: studentId })
            .populate({
                path: 'class',
                populate: [
                    { path: 'subject', select: 'subjectName subjectId credits' },
                    { path: 'semester', select: 'semesterName semesterId' }
                ]
            });

        // Ham chuyen doi diem chu sang he so 4.0
        const getLetterGradeValue = (letter) => {
            switch (letter) {
                case 'A': return 4.0;
                case 'B': return 3.0;
                case 'C': return 2.0;
                case 'D': return 1.0;
                default: return 0.0;
            }
        };

        // Ham tinh diem chu tu diem tong ket
        const getLetterGrade = (total) => {
            if (total >= 8.5) return 'A';
            if (total >= 7.0) return 'B';
            if (total >= 5.5) return 'C';
            if (total >= 4.0) return 'D';
            return 'F';
        };

        let totalCreditsWithGrades = 0;
        let sumGpaWeighted = 0;

        const grades = enrollments.map((e) => {
            const hasGrades = 
                e.attendanceScore !== null && 
                e.midtermScore !== null && 
                e.finalScore !== null;

            let totalScore = null;
            let letterGrade = null;
            let status = 'Chưa có điểm';

            if (hasGrades) {
                // Tinh diem he 10: 10% attendance + 20% Giua ky + 70% Cuoi ky
                const calculated = (e.attendanceScore * 0.1) + (e.midtermScore * 0.2) + (e.finalScore * 0.7);
                totalScore = Math.round(calculated * 10) / 10; // Lam tron 1 chu so thap phan
                letterGrade = getLetterGrade(totalScore);
                status = totalScore >= 4.0 ? 'Đạt' : 'Không đạt';

                const credits = e.class?.subject?.credits || 0;
                if (credits > 0) {
                    totalCreditsWithGrades += credits;
                    sumGpaWeighted += getLetterGradeValue(letterGrade) * credits;
                }
            }

            return {
                _id: e._id,
                classId: e.class?.classId || '-',
                subjectName: e.class?.subject?.subjectName || '-',
                credits: e.class?.subject?.credits || 0,
                semesterId: e.class?.semester?.semesterId || '-',
                semesterName: e.class?.semester?.semesterName || '-',
                attendanceScore: e.attendanceScore,
                midtermScore: e.midtermScore,
                finalScore: e.finalScore,
                totalScore,
                letterGrade,
                status
            };
        });

        // Tinh GPA tich luy he 4.0
        const cumulativeGpa = totalCreditsWithGrades > 0 
            ? Math.round((sumGpaWeighted / totalCreditsWithGrades) * 100) / 100 
            : 0;

        res.status(200).json({
            grades,
            gpa: cumulativeGpa
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy bảng điểm sinh viên!', error: error.message });
    }
};

// 3. get danh sach diem student cua mot lop hoc phan (only danh cho instructor day lop do)
// GET /api/grades/class/:classId hoac GET /api/grades/class?classId=...
const getClassGrades = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const classId = req.params.classId || req.query.classId;

        if (!classId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã lớp học phần!' });
        }

        // Tim lop hoc phan va doi chieu view instructor nay co in charge teaching khong
        const query = mongoose.isValidObjectId(classId)
            ? { _id: classId }
            : { classId: classId };

        const classObj = await Class.findOne({ ...query, instructor: instructorId });
        if (!classObj) {
            return res.status(403).json({ message: 'Bạn không có quyền quản lý lớp học phần này hoặc lớp học phần không tồn tại!' });
        }

        // get toan bo danh sach register hoc cua lop nay
        const enrollments = await Enrollment.find({ class: classObj._id })
            .populate('student', 'userId fullName email')
            .sort({ 'student.userId': 1 });

        res.status(200).json(enrollments);

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách điểm lớp học phần!', error: error.message });
    }
};

// 4. update bang diem hang loat cho lop hoc phan (only danh cho instructor day lop do)
// PUT /api/grades/class/:classId/bulk-update
const bulkUpdateGrades = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { classId } = req.params;

        // Tim lop hoc phan de xac thuc quyen so huu cua instructor
        const query = mongoose.isValidObjectId(classId)
            ? { _id: classId }
            : { classId: classId };

        const classObj = await Class.findOne({ ...query, instructor: instructorId });
        if (!classObj) {
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật bảng điểm lớp học phần này!' });
        }

        const gradesArray = Array.isArray(req.body) ? req.body : req.body.grades;
        if (!gradesArray || !Array.isArray(gradesArray)) {
            return res.status(400).json({ message: 'Dữ liệu cập nhật điểm gửi lên không hợp lệ!' });
        }

        // Ham tinh diem chu tu diem tong ket
        const getLetterGrade = (total) => {
            if (total >= 8.5) return 'A';
            if (total >= 7.0) return 'B';
            if (total >= 5.5) return 'C';
            if (total >= 4.0) return 'D';
            return 'F';
        };

        // perform update hang loat cac dong diem
        for (const item of gradesArray) {
            const { enrollmentId, attendanceScore, midtermScore, finalScore } = item;

            // Chuyen doi format so diem, xu ly gia tri rong/null
            const att = (attendanceScore !== '' && attendanceScore !== null && attendanceScore !== undefined) ? Number(attendanceScore) : null;
            const mid = (midtermScore !== '' && midtermScore !== null && midtermScore !== undefined) ? Number(midtermScore) : null;
            const fin = (finalScore !== '' && finalScore !== null && finalScore !== undefined) ? Number(finalScore) : null;

            let total = null;
            let letter = null;
            let stat = 'Chưa có điểm';

            // Crucial Logic: Tu dong tinh toan diem tong ket, xep loai chu va status dat/truot
            if (att !== null && mid !== null && fin !== null) {
                const calculated = (att * 0.1) + (mid * 0.2) + (fin * 0.7);
                total = Math.round(calculated * 10) / 10;
                letter = getLetterGrade(total);
                stat = total >= 4.0 ? 'Đạt' : 'Không đạt';
            }

            await Enrollment.findByIdAndUpdate(enrollmentId, {
                attendanceScore: att,
                midtermScore: mid,
                finalScore: fin,
                totalScore: total,
                letterGrade: letter,
                status: stat,
                // Giu dong bo cho subdocument grades
                'grades.attendance': att,
                'grades.midterm': mid,
                'grades.final': fin,
                'grades.total': total,
                'grades.letterGrade': letter
            });
        }

        res.status(200).json({ message: 'Cập nhật điểm thành công!' });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật bảng điểm hàng loạt!', error: error.message });
    }
};

// 5. update bang diem hang loat theo chuan structure moi (PUT/PATCH /api/grades/class/update)
const updateClassGrades = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { classId, studentGrades } = req.body;

        if (!classId || !studentGrades || !Array.isArray(studentGrades)) {
            return res.status(400).json({ message: 'Dữ liệu cập nhật điểm không hợp lệ!' });
        }

        const query = mongoose.isValidObjectId(classId)
            ? { _id: classId }
            : { classId: classId };

        const classObj = await Class.findOne({ ...query, instructor: instructorId });
        if (!classObj) {
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật bảng điểm cho lớp học phần này!' });
        }

        const getLetterGrade = (total) => {
            if (total >= 8.5) return 'A';
            if (total >= 7.0) return 'B';
            if (total >= 5.5) return 'C';
            if (total >= 4.0) return 'D';
            return 'F';
        };

        // Su dung Promise.all de save dong thoi
        const updatePromises = studentGrades.map(async (item) => {
            const { enrollmentId, attendance, midterm, final } = item;

            const att = (attendance !== '' && attendance !== null && attendance !== undefined) ? Number(attendance) : null;
            const mid = (midterm !== '' && midterm !== null && midterm !== undefined) ? Number(midterm) : null;
            const fin = (final !== '' && final !== null && final !== undefined) ? Number(final) : null;

            let total = null;
            let letter = null;

            if (att !== null && mid !== null && fin !== null) {
                const calculated = (att * 0.1) + (mid * 0.2) + (fin * 0.7);
                total = Math.round(calculated * 10) / 10;
                letter = getLetterGrade(total);
            }

            return Enrollment.findByIdAndUpdate(enrollmentId, {
                'grades.attendance': att,
                'grades.midterm': mid,
                'grades.final': fin,
                'grades.total': total,
                'grades.letterGrade': letter,
                // Tuong thich nguoc voi cac truong phang
                attendanceScore: att,
                midtermScore: mid,
                finalScore: fin,
                totalScore: total,
                letterGrade: letter,
                status: total !== null ? (total >= 4.0 ? 'Đạt' : 'Không đạt') : 'Chưa có điểm'
            }, { new: true });
        });

        await Promise.all(updatePromises);

        res.status(200).json({ message: 'Cập nhật điểm thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật điểm học viên!', error: error.message });
    }
};

module.exports = {
    getMyGrades,
    getClassGrades,
    bulkUpdateGrades,
    updateClassGrades
};
