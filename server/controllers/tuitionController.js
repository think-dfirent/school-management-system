const Enrollment = require('../models/Enrollment');
const Tuition = require('../models/Tuition');
const User = require('../models/User');
const Semester = require('../models/Semester');

// get info tuition ca nhan cua student (GET /api/tuition/my-tuition)
const getMyTuition = async (req, res) => {
    try {
        const studentId = req.user.id; // get ObjectId cua student tu token
        const PRICE_PER_CREDIT = 480000; // Dinh muc tuition co dinh 480.000 VND / credits

        // Tim cac lop hoc phan student da register hoc
        const enrollments = await Enrollment.find({ student: studentId })
            .populate({
                path: 'class',
                populate: [
                    { path: 'subject', select: 'subjectName subjectId credits' },
                    { path: 'semester', select: 'semesterName' }
                ]
            });

        // Exception 3.1: Xu ly an toan neu co so du lieu trong / student chua register lop nao
        if (!enrollments || enrollments.length === 0) {
            return res.status(200).json({
                semesters: [],
                grandTotal: {
                    grossTuition: 0,
                    paidAmount: 0,
                    debtAmount: 0
                }
            });
        }

        // Nhom du lieu register theo semester
        const semesterGroups = {};

        enrollments.forEach((e) => {
            if (e.class && e.class.semester) {
                const semId = e.class.semester._id.toString();
                const semName = e.class.semester.semesterName;

                if (!semesterGroups[semId]) {
                    semesterGroups[semId] = {
                        semesterId: semId,
                        semesterName: semName,
                        classes: [],
                        totalCredits: 0,
                        grossTuition: 0,
                        discount: 0,
                        paidAmount: 0,
                        debtAmount: 0
                    };
                }

                const credits = e.class.subject?.credits || 0;
                const fee = credits * PRICE_PER_CREDIT;

                semesterGroups[semId].classes.push({
                    classId: e.class.classId,
                    subjectId: e.class.subject?.subjectId || '-',
                    subjectName: e.class.subject?.subjectName || '-',
                    credits,
                    fee
                });

                semesterGroups[semId].totalCredits += credits;
            }
        });

        // Truy van doi chieu so tien da dong trong bang Tuition cho tung semester
        const semesterIds = Object.keys(semesterGroups);
        await Promise.all(semesterIds.map(async (semId) => {
            const tuitionRecord = await Tuition.findOne({ student: studentId, semester: semId });
            const group = semesterGroups[semId];
            
            const gross = group.totalCredits * PRICE_PER_CREDIT;
            group.grossTuition = tuitionRecord ? tuitionRecord.totalFee : gross;
            group.payableAmount = tuitionRecord ? tuitionRecord.payableAmount : gross;
            group.paidAmount = tuitionRecord ? tuitionRecord.paidAmount : 0;
            group.discount = tuitionRecord ? tuitionRecord.discount : 0;
            group.debtAmount = tuitionRecord ? tuitionRecord.debtAmount : gross;
        }));

        // Tinh toan tong so tuition luy ke (Grand Total)
        const grandTotal = {
            grossTuition: 0,
            payableAmount: 0,
            paidAmount: 0,
            debtAmount: 0
        };

        const semesterList = Object.values(semesterGroups);
        semesterList.forEach((group) => {
            grandTotal.grossTuition += group.grossTuition;
            grandTotal.payableAmount += group.payableAmount;
            grandTotal.paidAmount += group.paidAmount;
            grandTotal.debtAmount += group.debtAmount;
        });

        res.status(200).json({
            semesters: semesterList,
            grandTotal
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi truy xuất học phí sinh viên!', error: error.message });
    }
};

const getAllTuitions = async (req, res) => {
    try {
        const { semester, status, search } = req.query;
        const filters = {};

        if (semester) {
            filters.semester = semester;
        }
        if (status) {
            filters.status = status;
        }

        if (search) {
            // Find students that match search keyword in userId or fullName
            const matchedStudents = await User.find({
                role: 'student',
                $or: [
                    { userId: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const studentIds = matchedStudents.map(s => s._id);
            filters.student = { $in: studentIds };
        }

        const tuitions = await Tuition.find(filters)
            .populate('student', 'userId fullName email managementClass')
            .populate('semester', 'semesterName')
            .sort({ createdAt: -1 });

        res.status(200).json(tuitions);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tải danh sách học phí!', error: error.message });
    }
};

const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paidAmount } = req.body;

        const tuition = await Tuition.findById(id);
        if (!tuition) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn học phí!' });
        }

        const newPaidAmount = Number(paidAmount);
        if (isNaN(newPaidAmount) || newPaidAmount < 0) {
            return res.status(400).json({ message: 'Số tiền thanh toán không hợp lệ!' });
        }

        tuition.paidAmount = newPaidAmount;
        tuition.debtAmount = Math.max(0, tuition.payableAmount - newPaidAmount);

        if (tuition.paidAmount >= tuition.payableAmount) {
            tuition.status = 'paid';
        } else if (tuition.paidAmount > 0) {
            tuition.status = 'partial';
        } else {
            tuition.status = 'unpaid';
        }

        await tuition.save();
        res.status(200).json({ message: 'Cập nhật thanh toán thành công!', tuition });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật thanh toán!', error: error.message });
    }
};

const getMyTuitionActive = async (req, res) => {
    try {
        const studentId = req.user.id;
        const activeSemester = await Semester.findOne({ isActive: true });
        if (!activeSemester) {
            return res.status(404).json({ message: 'Không có học kỳ nào đang hoạt động!' });
        }

        const tuition = await Tuition.findOne({ student: studentId, semester: activeSemester._id })
            .populate('student', 'userId fullName email')
            .populate('semester', 'semesterName');

        if (!tuition) {
            return res.status(200).json({
                student: studentId,
                semester: activeSemester._id,
                totalFee: 0,
                discount: 0,
                payableAmount: 0,
                paidAmount: 0,
                debtAmount: 0,
                status: 'unpaid'
            });
        }

        res.status(200).json(tuition);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy học phí học kỳ hiện tại!', error: error.message });
    }
};

const syncAllTuitions = async (req, res) => {
    try {
        const PRICE_PER_CREDIT = 480000;
        
        // 1. Fetch active semester
        const activeSemester = await Semester.findOne({ isActive: true });
        if (!activeSemester) {
            return res.status(404).json({ message: 'Không tìm thấy học kỳ nào đang hoạt động để đồng bộ!' });
        }

        // 2. Fetch all enrollments for this active semester
        const enrollments = await Enrollment.find({ semester: activeSemester._id })
            .populate({
                path: 'class',
                populate: { path: 'subject' }
            });

        // 3. Group by student
        const studentCredits = {};
        enrollments.forEach((e) => {
            if (e.student && e.class && e.class.subject) {
                const sId = e.student.toString();
                const credits = e.class.subject.credits || 0;
                studentCredits[sId] = (studentCredits[sId] || 0) + credits;
            }
        });

        // 4. Find all existing tuition records for this active semester
        const allTuitions = await Tuition.find({ semester: activeSemester._id });
        const handledStudents = new Set();

        // 5. Update existing records
        for (const tuition of allTuitions) {
            const sId = tuition.student.toString();
            handledStudents.add(sId);

            const credits = studentCredits[sId] || 0;
            const expectedFee = credits * PRICE_PER_CREDIT;

            tuition.totalFee = expectedFee;
            tuition.payableAmount = expectedFee;
            tuition.debtAmount = Math.max(0, expectedFee - tuition.paidAmount);
            
            if (tuition.debtAmount <= 0) {
                tuition.status = 'paid';
            } else if (tuition.paidAmount > 0) {
                tuition.status = 'partial';
            } else {
                tuition.status = 'unpaid';
            }
            await tuition.save();
        }

        // 6. Create records for students who have enrollments but no Tuition record yet
        for (const [sId, credits] of Object.entries(studentCredits)) {
            if (!handledStudents.has(sId)) {
                const expectedFee = credits * PRICE_PER_CREDIT;
                const newTuition = new Tuition({
                    student: sId,
                    semester: activeSemester._id,
                    totalFee: expectedFee,
                    payableAmount: expectedFee,
                    paidAmount: 0,
                    debtAmount: expectedFee,
                    status: expectedFee > 0 ? 'unpaid' : 'paid'
                });
                await newTuition.save();
            }
        }

        res.status(200).json({ message: 'Đã đồng bộ lại toàn bộ học phí!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi đồng bộ dữ liệu học phí!', error: error.message });
    }
};

module.exports = {
    getMyTuition,
    getAllTuitions,
    updatePayment,
    getMyTuitionActive,
    syncAllTuitions
};
