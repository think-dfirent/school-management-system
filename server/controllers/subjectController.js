const Subject = require('../models/Subject');
const Class = require('../models/Class');

// 1. get danh sach tat ca subject (GET /api/subjects)
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ createdAt: -1 });
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách môn học!', error: error.message });
    }
};

// 2. Tao subject moi (POST /api/subjects)
const createSubject = async (req, res) => {
    try {
        const { subjectId, subjectName, credits } = req.body;

        // Exception 4.1: check view subjectId da ton tai chua
        const existingSubject = await Subject.findOne({ subjectId });
        if (existingSubject) {
            return res.status(400).json({ message: 'Mã môn học này đã tồn tại trên hệ thống.' });
        }

        const newSubject = new Subject({
            subjectId,
            subjectName,
            credits
        });

        await newSubject.save();
        res.status(201).json({ message: 'Thêm môn học thành công!', subject: newSubject });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo môn học', error: error.message });
    }
};

// 3. update subject (PUT /api/subjects/:id)
const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { subjectId, subjectName, credits } = req.body;

        // Exception 4.1: check view subjectId da ton tai o subject khac chua
        const existingSubject = await Subject.findOne({ subjectId, _id: { $ne: id } });
        if (existingSubject) {
            return res.status(400).json({ message: 'Mã môn học này đã tồn tại trên hệ thống.' });
        }

        const updatedSubject = await Subject.findByIdAndUpdate(
            id,
            { subjectId, subjectName, credits },
            { new: true, runValidators: true }
        );

        if (!updatedSubject) {
            return res.status(404).json({ message: 'Không tìm thấy môn học cần cập nhật!' });
        }

        res.status(200).json({ message: 'Cập nhật thông tin môn học thành công!', subject: updatedSubject });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật môn học', error: error.message });
    }
};

// 4. delete subject (DELETE /api/subjects/:id)
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        // Exception 5.1: check view subject co dang co lop hoc phan active khong
        const classExists = await Class.findOne({ subject: id });
        if (classExists) {
            return res.status(400).json({ message: 'Không thể xóa môn học đang có lớp học phần hoạt động.' });
        }

        const deletedSubject = await Subject.findByIdAndDelete(id);
        if (!deletedSubject) {
            return res.status(404).json({ message: 'Không tìm thấy môn học cần xóa!' });
        }

        res.status(200).json({ message: 'Xóa môn học thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa môn học', error: error.message });
    }
};

// Alias cu de tuong thich nguoc
const getAllSubjects = async (req, res) => {
    return getSubjects(req, res);
};

module.exports = {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    getAllSubjects
};
