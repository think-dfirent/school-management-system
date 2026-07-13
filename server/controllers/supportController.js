const SupportRequest = require('../models/SupportRequest');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

// 1. get danh sach request gui Admin (GET /api/support/admin)
const getAdminRequests = async (req, res) => {
    try {
        const requests = await SupportRequest.find({ recipientType: 'admin' })
            .populate('student', 'fullName userId email')
            .populate('resolvedBy', 'fullName userId')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách yêu cầu hỗ trợ!', error: error.message });
    }
};

// 2. Xu ly feedback request support cua Admin (PUT /api/support/:id)
const processRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;
        const adminId = req.user.id; // ID cua Admin hien tai tu token middleware

        // Tim request support
        const request = await SupportRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ!' });
        }

        // Concurrency Check (Exception 5.1):
        // Neu request da co status resolved va da duoc giai quyet boi Admin khac
        if (request.status === 'resolved' && request.resolvedBy && request.resolvedBy.toString() !== adminId.toString()) {
            return res.status(409).json({ 
                message: 'Yêu cầu này đã được một Quản trị viên khác xử lý. Vui lòng làm mới danh sách!' 
            });
        }

        // update info feedback
        request.status = status;
        request.response = response;
        request.resolvedBy = adminId;

        await request.save();

        res.status(200).json({ message: 'Xử lý yêu cầu thành công!', request });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu hỗ trợ!', error: error.message });
    }
};

// 3. get danh sach request gui instructor (GET /api/support/instructor)
const getInstructorRequests = async (req, res) => {
    try {
        const instructorId = req.user.id;

        // Tim tat ca cac lop instructor nay in charge
        const classes = await Class.find({ instructor: instructorId });
        const classIds = classes.map(c => c._id);

        // Tim cac request support co lien quan
        const requests = await SupportRequest.find({
            recipientType: 'instructor',
            relatedClass: { $in: classIds }
        })
        .populate('student', 'fullName userId email')
        .populate('relatedClass', 'classId room')
        .populate('resolvedBy', 'fullName userId')
        .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy yêu cầu hỗ trợ cho giảng viên!', error: error.message });
    }
};

// 4. instructor feedback request support (PUT /api/support/instructor/:id)
const processInstructorRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;
        const instructorId = req.user.id;

        const request = await SupportRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ!' });
        }

        // Concurrency Check (Exception 5.1): status hien tai khac 'pending' thi bao loi
        if (request.status !== 'pending') {
            return res.status(409).json({ 
                message: 'Dữ liệu đã có sự thay đổi. Yêu cầu này không còn ở trạng thái chờ xử lý. Vui lòng tải lại trang!' 
            });
        }

        request.status = status;
        request.response = response;
        request.resolvedBy = instructorId;

        await request.save();

        res.status(200).json({ message: 'Xử lý yêu cầu thành công!', request });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu hỗ trợ cho giảng viên!', error: error.message });
    }
};

// 5. Hoc vien get danh sach lop hoc phan da register (GET /api/support/my-enrolled-classes)
const getEnrolledClassesForSupport = async (req, res) => {
    try {
        const studentId = req.user.id;
        const enrollments = await Enrollment.find({ student: studentId })
            .populate({
                path: 'class',
                populate: {
                    path: 'subject',
                    select: 'subjectName subjectId'
                }
            });

        const classes = enrollments
            .filter(e => e.class)
            .map(e => e.class);

        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách lớp học đăng ký!', error: error.message });
    }
};

// 6. Hoc vien tao request support moi (POST /api/support/student)
const createSupportRequest = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { title, content, recipientType, relatedClass } = req.body;

        // Validation: check truong bat buoc
        if (!title || !content || !recipientType) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
        }

        if (recipientType === 'instructor' && !relatedClass) {
            return res.status(400).json({ message: 'Vui lòng chọn lớp học phần liên quan khi gửi cho giảng viên!' });
        }

        // Tao request support moi
        const newRequest = new SupportRequest({
            student: studentId,
            title,
            content,
            recipientType,
            relatedClass: recipientType === 'instructor' ? relatedClass : undefined,
            status: 'pending'
        });

        // Exception 5.1: boc trong try-catch, nem loi 500 cu the
        try {
            await newRequest.save();
        } catch (dbErr) {
            return res.status(500).json({ message: 'Không thể gửi yêu cầu lúc này, vui lòng thử lại sau.' });
        }

        res.status(201).json({ message: 'Gửi yêu cầu thành công!', request: newRequest });
    } catch (error) {
        res.status(500).json({ message: 'Không thể gửi yêu cầu lúc này, vui lòng thử lại sau.', error: error.message });
    }
};

// 7. Hoc vien get schedule su request support ca nhan (GET /api/support/me)
const getMySupportRequests = async (req, res) => {
    try {
        const studentId = req.user.id;
        const requests = await SupportRequest.find({ student: studentId })
            .populate({
                path: 'relatedClass',
                populate: {
                    path: 'subject',
                    select: 'subjectName subjectId'
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy lịch sử yêu cầu hỗ trợ!', error: error.message });
    }
};

// 8. Hoc vien update request support (PUT /api/support/:id)
const updateSupportRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;
        const { title, content, recipientType, relatedClass } = req.body;

        const request = await SupportRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ!' });
        }

        if (request.student.toString() !== studentId) {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối!' });
        }

        if (request.status !== 'pending') {
            return res.status(403).json({ message: 'Không thể sửa yêu cầu đã được xử lý!' });
        }

        request.title = title || request.title;
        request.content = content || request.content;
        request.recipientType = recipientType || request.recipientType;
        request.relatedClass = recipientType === 'instructor' ? relatedClass : undefined;

        await request.save();
        res.status(200).json({ message: 'Cập nhật yêu cầu thành công!', request });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật yêu cầu!', error: error.message });
    }
};

// 9. Hoc vien delete request support (DELETE /api/support/:id)
const deleteSupportRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        const request = await SupportRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ!' });
        }

        if (request.student.toString() !== studentId) {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối!' });
        }

        if (request.status !== 'pending') {
            return res.status(403).json({ message: 'Không thể xóa yêu cầu đã được xử lý!' });
        }

        await SupportRequest.findByIdAndDelete(id);
        res.status(200).json({ message: 'Xóa yêu cầu thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa yêu cầu!', error: error.message });
    }
};

module.exports = {
    getAdminRequests,
    processRequest,
    getInstructorRequests,
    processInstructorRequest,
    getEnrolledClassesForSupport,
    createSupportRequest,
    getMySupportRequests,
    updateSupportRequest,
    deleteSupportRequest
};
