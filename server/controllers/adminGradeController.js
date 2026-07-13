const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');

/* *
 * Helper function to calculate letter grade based on unrounded total score.
 * 
 * @param {number} total 
 * @returns {string} */
const getLetterGrade = (total) => {
    if (total >= 8.95) return 'A+';
    if (total >= 8.45) return 'A';
    if (total >= 7.95) return 'B+';
    if (total >= 6.95) return 'B';
    if (total >= 6.45) return 'C+';
    if (total >= 5.45) return 'C';
    if (total >= 4.95) return 'D+';
    if (total >= 3.95) return 'D';
    return 'F';
};

/* *
 * Fetch all enrollments with optional filters
 * GET /api/admin/grades */
exports.getAdminGrades = async (req, res) => {
    try {
        const { semesterId, classId, search } = req.query;
        let query = {};

        if (semesterId && semesterId !== 'all') {
            if (mongoose.isValidObjectId(semesterId)) {
                query.semester = semesterId;
            }
        }

        if (classId && classId !== 'all') {
            if (mongoose.isValidObjectId(classId)) {
                query.class = classId;
            }
        }

        if (search) {
            // Find student users matching userId or fullName search string
            const users = await User.find({
                $or: [
                    { userId: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            query.student = { $in: userIds };
        }

        const enrollments = await Enrollment.find(query)
            .populate({
                path: 'student',
                select: 'userId fullName email'
            })
            .populate({
                path: 'class',
                select: 'classId subject',
                populate: {
                    path: 'subject',
                    select: 'subjectName subjectId credits'
                }
            })
            .populate({
                path: 'semester',
                select: 'semesterName semesterCode'
            })
            .sort({ createdAt: -1 });

        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách điểm học viên!', error: error.message });
    }
};

/* *
 * Update single enrollment grade
 * PUT /api/admin/grades/:enrollmentId */
exports.updateAdminGrade = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { attendanceScore, midtermScore, finalScore } = req.body;

        if (!mongoose.isValidObjectId(enrollmentId)) {
            return res.status(400).json({ message: 'Mã đăng ký môn học không hợp lệ!' });
        }

        // Clean inputs and handle null/empty strings
        const att = (attendanceScore !== '' && attendanceScore !== null && attendanceScore !== undefined) ? Number(attendanceScore) : null;
        const mid = (midtermScore !== '' && midtermScore !== null && midtermScore !== undefined) ? Number(midtermScore) : null;
        const fin = (finalScore !== '' && finalScore !== null && finalScore !== undefined) ? Number(finalScore) : null;

        // Validation limits
        const validateScore = (val) => {
            if (val === null) return true;
            return typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 10;
        };

        if (!validateScore(att) || !validateScore(mid) || !validateScore(fin)) {
            return res.status(400).json({ message: 'Điểm số phải nằm trong khoảng từ 0 đến 10!' });
        }

        let total = null;
        let letter = null;
        let stat = 'Chưa có điểm';

        if (att !== null && mid !== null && fin !== null) {
            const calculated = (att * 0.1) + (mid * 0.2) + (fin * 0.7);
            total = Math.round(calculated * 10) / 10;
            letter = getLetterGrade(calculated);
            stat = calculated >= 3.95 ? 'Đạt' : 'Không đạt';
        }

        const updatedEnrollment = await Enrollment.findByIdAndUpdate(
            enrollmentId,
            {
                attendanceScore: att,
                midtermScore: mid,
                finalScore: fin,
                totalScore: total,
                letterGrade: letter,
                status: stat,
                // Synchronize grades subdocument fields
                'grades.attendance': att,
                'grades.midterm': mid,
                'grades.final': fin,
                'grades.total': total,
                'grades.letterGrade': letter
            },
            { new: true }
        ).populate({
            path: 'student',
            select: 'userId fullName email'
        }).populate({
            path: 'class',
            select: 'classId subject',
            populate: {
                path: 'subject',
                select: 'subjectName subjectId credits'
            }
        }).populate({
            path: 'semester',
            select: 'semesterName semesterCode'
        });

        if (!updatedEnrollment) {
            return res.status(404).json({ message: 'Không tìm thấy bản ghi đăng ký để cập nhật!' });
        }

        res.status(200).json({
            message: 'Cập nhật điểm học viên thành công!',
            enrollment: updatedEnrollment
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật điểm học viên!', error: error.message });
    }
};
