const Semester = require('../models/Semester');

// 1. get danh sach semester (sort theo startDate giam dan)
const getSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find().sort({ startDate: -1 });
        res.status(200).json(semesters);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách học kỳ!', error: error.message });
    }
};

// 2. Tao semester moi
const createSemester = async (req, res) => {
    try {
        const { semesterId, semesterName, startDate, endDate, registrationStartDate, registrationEndDate, isActive } = req.body;

        // Exception 7.1 (Duplicate Check): Check if semesterName or semesterId already exists
        const duplicate = await Semester.findOne({
            $or: [
                { semesterId },
                { semesterName }
            ]
        });

        if (duplicate) {
            return res.status(400).json({ message: "Tên học kỳ này đã tồn tại trên hệ thống!" });
        }

        // Singleton Active State logic
        if (isActive === true) {
            await Semester.updateMany({}, { isActive: false });
        }

        const newSemester = new Semester({
            semesterId,
            semesterName,
            startDate,
            endDate,
            registrationStartDate,
            registrationEndDate,
            isActive: isActive || false
        });

        await newSemester.save();
        res.status(201).json({ message: 'Cập nhật học kỳ thành công!', semester: newSemester });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo học kỳ!', error: error.message });
    }
};

// 3. update semester
const updateSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const { semesterId, semesterName, startDate, endDate, registrationStartDate, registrationEndDate, isActive } = req.body;

        // Exception 7.1 (Duplicate Check): Check if semesterName or semesterId already exists (exclude current ID)
        const duplicate = await Semester.findOne({
            _id: { $ne: id },
            $or: [
                { semesterId },
                { semesterName }
            ]
        });

        if (duplicate) {
            return res.status(400).json({ message: "Tên học kỳ này đã tồn tại trên hệ thống!" });
        }

        // Singleton Active State logic
        if (isActive === true) {
            await Semester.updateMany({}, { isActive: false });
        }

        const updatedSemester = await Semester.findByIdAndUpdate(
            id,
            { semesterId, semesterName, startDate, endDate, registrationStartDate, registrationEndDate, isActive: isActive || false },
            { new: true, runValidators: true }
        );

        if (!updatedSemester) {
            return res.status(404).json({ message: 'Không tìm thấy học kỳ để cập nhật!' });
        }

        res.status(200).json({ message: 'Cập nhật học kỳ thành công!', semester: updatedSemester });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật học kỳ!', error: error.message });
    }
};

// Khai bao getAllSemesters de backwards compatibility
const getAllSemesters = async (req, res) => {
    return getSemesters(req, res);
};

module.exports = {
    getSemesters,
    createSemester,
    updateSemester,
    getAllSemesters
};
