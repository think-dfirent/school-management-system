const Enrollment = require('../models/Enrollment');
const Tuition = require('../models/Tuition');

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
            group.grossTuition = gross;
            group.paidAmount = tuitionRecord ? tuitionRecord.paidAmount : 0;
            group.discount = 0; // default chiet khau la 0
            group.debtAmount = Math.max(0, gross - group.paidAmount);
        }));

        // Tinh toan tong so tuition luy ke (Grand Total)
        const grandTotal = {
            grossTuition: 0,
            paidAmount: 0,
            debtAmount: 0
        };

        const semesterList = Object.values(semesterGroups);
        semesterList.forEach((group) => {
            grandTotal.grossTuition += group.grossTuition;
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

module.exports = {
    getMyTuition
};
