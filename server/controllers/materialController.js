const CourseMaterial = require('../models/CourseMaterial');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const path = require('path');
const { s3Client, BUCKET_NAME } = require('../config/s3Config');
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Helper to upload a buffer to AWS S3
const uploadToS3 = async (file, folder = 'materials') => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const key = `${folder}/${uniqueSuffix}-${base}${ext}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
    });

    await s3Client.send(command);
    return {
        key,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
    };
};

// Helper to delete an object from AWS S3
const deleteFromS3 = async (key) => {
    if (!key) return;
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });
    await s3Client.send(command);
};

// Helper to generate a presigned download URL valid for 15 minutes (900 seconds)
const generatePresignedUrl = async (key) => {
    if (!key) return '';
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });
    // expires in 15 minutes (900 seconds)
    return await getSignedUrl(s3Client, command, { expiresIn: 900 });
};

// 1. get danh sach materials theo lop hoc phan (GET /api/materials/:classId)
const getCourseMaterials = async (req, res) => {
    try {
        const { classId } = req.params;
        const materials = await CourseMaterial.find({ class: classId })
            .populate('instructor', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài liệu học phần!', error: error.message });
    }
};

// 2. Dang load materials/assignments hoc phan (POST /api/materials)
const uploadMaterial = async (req, res) => {
    try {
        const { classId, title, description, type, dueDate } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Vui lòng chọn tệp tin tài liệu cần tải lên!' });
        }

        // check phan mo rong file (cam file thuc thi doc hai)
        const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.vbs', '.scr'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (forbiddenExts.includes(ext)) {
            return res.status(400).json({ message: 'Định dạng tệp tin này không được phép (.exe, .bat, v.v.)!' });
        }

        // check dung luong tep tin (toi da 50MB)
        if (file.size > 50 * 1024 * 1024) {
            return res.status(400).json({ message: 'Dung lượng tệp vượt quá giới hạn 50MB!' });
        }

        // Han submit assignments lon
        if (type === 'assignment') {
            if (!dueDate) {
                return res.status(400).json({ message: 'Vui lòng nhập hạn nộp bài cho bài tập học phần!' });
            }
            const parsedDueDate = new Date(dueDate);
            if (parsedDueDate.getTime() < Date.now()) {
                return res.status(400).json({ message: 'Hạn nộp bài phải lớn hơn thời gian hiện tại!' });
            }
        }

        // load len S3 direct tu Buffer
        const s3UploadResult = await uploadToS3(file, 'materials');

        // save info vao MongoDB
        const newMaterial = new CourseMaterial({
            class: classId,
            instructor: req.user.id,
            title,
            description,
            type,
            fileUrl: s3UploadResult.url,
            s3Key: s3UploadResult.key,
            dueDate: type === 'assignment' ? new Date(dueDate) : null
        });

        await newMaterial.save();
        res.status(201).json({ message: 'Đăng tải tài liệu thành công!', material: newMaterial });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi đăng tải tài liệu học phần!', error: error.message });
    }
};

// 3. Quy doi S3 Key get lien ket load Presigned URL (GET /api/materials/presigned-url)
const getMaterialUrl = async (req, res) => {
    try {
        const { key } = req.query;
        if (!key) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã Key của đối tượng S3!' });
        }

        const presignedUrl = await generatePresignedUrl(key);
        res.status(200).json({ presignedUrl });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo Presigned URL cho tài liệu!', error: error.message });
    }
};

// 4. get link load materials hoc tap (GET /api/materials/:materialId/download)
const downloadMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const material = await CourseMaterial.findById(materialId);
        
        if (!material) {
            return res.status(404).json({ message: 'Không thể tải tài liệu lúc này. File không tồn tại hoặc đã bị xóa!' });
        }

        // Tao presigned URL dong cho tep tin rieng tu
        let downloadUrl = material.fileUrl;
        if (material.s3Key) {
            downloadUrl = await generatePresignedUrl(material.s3Key);
        }

        res.status(200).json({ fileUrl: downloadUrl });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy liên kết tải tài liệu!', error: error.message });
    }
};

// 5. delete materials hoc tap (DELETE /api/materials/:materialId)
const deleteMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const material = await CourseMaterial.findById(materialId);
        
        if (!material) {
            return res.status(404).json({ message: 'Không tìm thấy tài liệu cần xóa!' });
        }

        // delete tep khoi AWS S3 truoc
        if (material.s3Key) {
            await deleteFromS3(material.s3Key);
        }

        // delete document khoi MongoDB
        await CourseMaterial.findByIdAndDelete(materialId);

        // Dong thoi don dep cac bai submit cua student lien quan neu co
        await AssignmentSubmission.deleteMany({ assignment: materialId });

        res.status(200).json({ message: 'Xóa tài liệu học phần thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa tài liệu học phần!', error: error.message });
    }
};

// 6. Hoc vien get danh sach assignments lon & status submit bai (GET /api/materials/student/:classId/assignments)
const getStudentAssignments = async (req, res) => {
    try {
        const classId = req.params.classId || req.query.classId;
        const studentId = req.user.id;

        if (!classId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã lớp học phần!' });
        }

        const assignments = await CourseMaterial.find({
            class: classId,
            type: 'assignment'
        })
        .populate('instructor', 'fullName email')
        .sort({ createdAt: -1 });

        const assignmentsWithSubmission = await Promise.all(
            assignments.map(async (assign) => {
                const submission = await AssignmentSubmission.findOne({
                    assignment: assign._id,
                    student: studentId
                });

                // Generate presigned URL for student submission if it exists
                let submissionFileUrl = submission ? submission.fileUrl : null;
                if (submission && submission.s3Key) {
                    submissionFileUrl = await generatePresignedUrl(submission.s3Key);
                }

                return {
                    ...assign.toObject(),
                    submission: submission ? {
                        _id: submission._id,
                        fileUrl: submissionFileUrl,
                        submittedAt: submission.submittedAt
                    } : null
                };
            })
        );

        res.status(200).json(assignmentsWithSubmission);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài tập lớn!', error: error.message });
    }
};

// 7. Hoc vien submit assignments lon (POST /api/materials/submit)
const submitAssignment = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { assignmentId } = req.body;
        const file = req.file;

        if (!assignmentId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã bài tập lớn!' });
        }

        const assignment = await CourseMaterial.findById(assignmentId);
        if (!assignment || assignment.type !== 'assignment') {
            return res.status(404).json({ message: 'Không tìm thấy thông tin bài tập lớn!' });
        }

        if (Date.now() > new Date(assignment.dueDate).getTime()) {
            return res.status(400).json({ message: 'Đã quá hạn nộp bài!' });
        }

        if (!file) {
            return res.status(400).json({ message: 'Vui lòng chọn tệp tin bài làm!' });
        }

        const fileExt = path.extname(file.originalname).toLowerCase();
        const forbiddenExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.vbs', '.scr'];
        if (forbiddenExtensions.includes(fileExt)) {
            return res.status(400).json({ message: 'Định dạng tệp tin thực thi bị cấm tải lên!' });
        }

        // load len S3 direct
        const s3UploadResult = await uploadToS3(file, 'submissions');

        // save hoac ghi de bai submit
        const submission = await AssignmentSubmission.findOneAndUpdate(
            { assignment: assignmentId, student: studentId },
            { 
                fileUrl: s3UploadResult.url, 
                s3Key: s3UploadResult.key,
                submittedAt: Date.now() 
            },
            { new: true, upsert: true }
        );

        res.status(200).json({ message: 'Nộp bài thành công!', submission });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi nộp bài tập lớn!', error: error.message });
    }
};

// 8. Hoc vien get materials (GET /api/materials/student/:classId)
const getStudentMaterials = async (req, res) => {
    try {
        const { classId } = req.params;
        const materials = await CourseMaterial.find({ class: classId, type: { $ne: 'assignment' } })
            .populate('instructor', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài liệu học tập!', error: error.message });
    }
};

// 9. get link load bai submit cua hoc vien (GET /api/materials/submission/:submissionId/download)
const downloadSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const submission = await AssignmentSubmission.findById(submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy bài làm đã nộp!' });
        }

        // Tao presigned URL dong cho bai submit cua hoc vien
        let downloadUrl = submission.fileUrl;
        if (submission.s3Key) {
            downloadUrl = await generatePresignedUrl(submission.s3Key);
        }

        res.status(200).json({ fileUrl: downloadUrl });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy liên kết tải bài nộp!', error: error.message });
    }
};

module.exports = {
    getCourseMaterials,
    uploadMaterial,
    getMaterialUrl,
    downloadMaterial,
    deleteMaterial,
    getStudentAssignments,
    submitAssignment,
    getStudentMaterials,
    downloadSubmission
};
