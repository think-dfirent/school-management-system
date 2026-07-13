const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const Semester = require('../models/Semester');
const Tuition = require('../models/Tuition');

const CREDIT_PRICE = 480000;

// 1. get du lieu register subject (GET /api/registrations)
const getRegistrationData = async (req, res) => {
    try {
        const studentId = req.user.id; // get ObjectId cua hoc sinh tu token

        // Tim semester dang active
        const activeSemester = await Semester.findOne({ isActive: true });
        if (!activeSemester) {
            return res.status(200).json({
                isOpen: false,
                availableClasses: [],
                enrolledClasses: [],
                semesterName: "Không có học kỳ",
                message: "Đã hết thời gian đăng ký học phần."
            });
        }

        // check time hien tai
        const now = new Date();
        const isOpen = now >= activeSemester.registrationStartDate && now <= activeSemester.registrationEndDate;

        // Tim tat ca lop hoc phan mo trong semester nay
        const availableClasses = await Class.find({ semester: activeSemester._id })
            .populate('subject', 'subjectName subjectId credits')
            .populate('instructor', 'fullName userId')
            .populate('semester', 'semesterName')
            .sort({ classId: 1 });

        // Tim cac lop hoc phan student nay da register trong semester nay
        const enrollments = await Enrollment.find({ 
            student: studentId,
            semester: activeSemester._id
        }).populate({
            path: 'class',
            populate: [
                { path: 'subject', select: 'subjectName subjectId credits' },
                { path: 'instructor', select: 'fullName userId' },
                { path: 'semester', select: 'semesterName' }
            ]
        });

        const enrolledClasses = enrollments
            .map(e => e.class)
            .filter(c => c !== null);

        res.status(200).json({
            isOpen,
            availableClasses,
            enrolledClasses,
            semesterName: activeSemester.semesterName,
            registrationStartDate: activeSemester.registrationStartDate,
            registrationEndDate: activeSemester.registrationEndDate
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu lớp học phần đăng ký!', error: error.message });
    }
};

// 2. register lop hoc phan (POST /api/registrations)
const registerClass = async (req, res) => {
    try {
        const { classId } = req.body; // classId la MongoDB ObjectId cua lop hoc phan
        const studentId = req.user.id; // get ObjectId cua hoc sinh tu token

        // Tim lop hoc phan can register
        const targetClass = await Class.findById(classId).populate('subject');
        if (!targetClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học phần tuyển sinh!' });
        }

        // Tim semester active
        const activeSemester = await Semester.findOne({ isActive: true });
        if (!activeSemester || activeSemester._id.toString() !== targetClass.semester.toString()) {
            return res.status(400).json({ message: 'Học kỳ đăng ký không hợp lệ!' });
        }

        // Validation 1 (Time check): Re-check if the registration window is open
        const now = new Date();
        if (now < activeSemester.registrationStartDate || now > activeSemester.registrationEndDate) {
            return res.status(403).json({ 
                message: 'Thao tác thất bại: Cổng đăng ký tín chỉ hiện không mở trong thời gian này.' 
            });
        }

        // Validation 2 (Duplicate - Exception 4.3): Check if an enrollment already exists
        const alreadyEnrolled = await Enrollment.findOne({ student: studentId, class: classId });
        if (alreadyEnrolled) {
            return res.status(400).json({ message: "Bạn đã đăng ký môn học này rồi!" });
        }

        // Validation 3 (Capacity - Exception 4.1): Check if class.currentStudents >= class.maxStudents
        if (targetClass.currentStudents >= targetClass.maxStudents) {
            return res.status(400).json({ message: "Lớp học phần này đã đầy!" });
        }

        // Validation 4 (Schedule Overlap - Exception 4.2): Fetch enrolled classes and check overlap
        const studentEnrollments = await Enrollment.find({ 
            student: studentId,
            semester: activeSemester._id
        }).populate({
            path: 'class',
            populate: { path: 'subject' }
        });

        const enrolledClasses = studentEnrollments
            .map(e => e.class)
            .filter(c => c !== null);

        // Duyet check duplicate thoi khoa bieu
        for (const existingClass of enrolledClasses) {
            for (const existingSched of existingClass.schedules) {
                for (const newSched of targetClass.schedules) {
                    if (existingSched.dayOfWeek === newSched.dayOfWeek) {
                        // Cong thuc check giao ca hoc: newStart <= existingEnd && newEnd >= existingStart
                        const overlap = newSched.startPeriod <= existingSched.endPeriod && newSched.endPeriod >= existingSched.startPeriod;
                        
                        if (overlap) {
                            return res.status(400).json({ 
                                message: `Bị trùng lịch với môn học [${existingClass.subject.subjectName}]. Vui lòng chọn nhóm lớp khác!` 
                            });
                        }
                    }
                }
            }
        }

        // next hanh ghi nhan register hoc phan
        const newEnrollment = new Enrollment({
            student: studentId,
            class: classId,
            semester: activeSemester._id
        });

        await newEnrollment.save();

        // Tang so luong student hien tai trong lop (update nguyen tu)
        await Class.findByIdAndUpdate(classId, { $inc: { currentStudents: 1 } });

        // Update hoc phi cho hoc sinh (Tuition)
        const credits = targetClass.subject?.credits || 0;
        const addedFee = credits * CREDIT_PRICE;
        const updatedTuition = await Tuition.findOneAndUpdate(
            { student: studentId, semester: activeSemester._id },
            {
                $inc: {
                    totalFee: addedFee,
                    payableAmount: addedFee,
                    debtAmount: addedFee
                },
                $setOnInsert: {
                    discount: 0,
                    paidAmount: 0
                }
            },
            { upsert: true, new: true }
        );

        if (updatedTuition) {
            if (updatedTuition.debtAmount <= 0) {
                updatedTuition.status = 'paid';
            } else if (updatedTuition.paidAmount > 0) {
                updatedTuition.status = 'partial';
            } else {
                updatedTuition.status = 'unpaid';
            }
            await updatedTuition.save();
        }

        res.status(201).json({ message: 'Đăng ký thành công', enrollment: newEnrollment });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi đăng ký học phần!', error: error.message });
    }
};

// Khai bao cac function cu lam alias cho backwards compatibility
const getAvailableClasses = async (req, res) => {
    // Goi gian tiep getRegistrationData
    return getRegistrationData(req, res);
};

const enrollClass = async (req, res) => {
    // Goi gian tiep registerClass
    return registerClass(req, res);
};

// 3. Huy register lop hoc phan (DELETE /api/registrations/:classId)
const cancelRegistration = async (req, res) => {
    try {
        const { classId } = req.params;
        const studentId = req.user.id;

        // Tim semester dang active
        const activeSemester = await Semester.findOne({ isActive: true });
        if (!activeSemester) {
            return res.status(400).json({ message: "Đã hết thời gian thao tác. Bạn không thể hủy học phần lúc này!" });
        }

        // check han time register (Validation 1)
        const now = new Date();
        if (now < activeSemester.registrationStartDate || now > activeSemester.registrationEndDate) {
            return res.status(403).json({ 
                message: 'Thao tác thất bại: Cổng đăng ký tín chỉ hiện không mở trong thời gian này.' 
            });
        }

        // check su ton tai cua Don register (Validation 2)
        const enrollment = await Enrollment.findOne({
            student: studentId,
            class: classId,
            semester: activeSemester._id
        }).populate({
            path: 'class',
            populate: { path: 'subject' }
        });

        if (!enrollment) {
            return res.status(404).json({ message: "Không tìm thấy dữ liệu đăng ký!" });
        }

        // delete don register va update so luong student
        await Enrollment.findByIdAndDelete(enrollment._id);

        // update lai so luong student hien tai cua lop hoc phan
        await Class.findByIdAndUpdate(classId, { $inc: { currentStudents: -1 } });

        // Update giam hoc phi cho hoc sinh (Tuition)
        const credits = enrollment.class?.subject?.credits || 0;
        const deductedFee = credits * CREDIT_PRICE;
        if (deductedFee > 0) {
            const updatedTuition = await Tuition.findOneAndUpdate(
                { student: studentId, semester: activeSemester._id },
                {
                    $inc: {
                        totalFee: -deductedFee,
                        payableAmount: -deductedFee,
                        debtAmount: -deductedFee
                    }
                },
                { new: true }
            );

            if (updatedTuition) {
                if (updatedTuition.debtAmount < 0) {
                    updatedTuition.debtAmount = 0;
                }
                if (updatedTuition.debtAmount <= 0) {
                    updatedTuition.status = 'paid';
                } else if (updatedTuition.paidAmount > 0) {
                    updatedTuition.status = 'partial';
                } else {
                    updatedTuition.status = 'unpaid';
                }
                await updatedTuition.save();
            }
        }

        res.status(200).json({ message: "Hủy đăng ký thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi hủy đăng ký môn học!", error: error.message });
    }
};

module.exports = {
    getRegistrationData,
    registerClass,
    enrollClass,
    getAvailableClasses,
    cancelRegistration
};
