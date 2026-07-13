const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Department = require('./models/Department');
const Semester = require('./models/Semester');
const Subject = require('./models/Subject');
const Class = require('./models/Class');
const Enrollment = require('./models/Enrollment');
const Tuition = require('./models/Tuition');
const Attendance = require('./models/Attendance');
const CourseMaterial = require('./models/CourseMaterial');
const AssignmentSubmission = require('./models/AssignmentSubmission');
const SupportRequest = require('./models/SupportRequest');
const Notification = require('./models/Notification');
const Room = require('./models/Room');

async function seedDatabase() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MONGO_URI is not defined in environment variables!');
        }
        await mongoose.connect(uri);
        console.log('MongoDB Connected successfully for seeding...');

        // 1. FRESH START: Clear database
        console.log('Clearing database collections...');
        await User.deleteMany({});
        await Department.deleteMany({});
        await Semester.deleteMany({});
        await Subject.deleteMany({});
        await Class.deleteMany({});
        await Enrollment.deleteMany({});
        await Tuition.deleteMany({});
        await Attendance.deleteMany({});
        await CourseMaterial.deleteMany({});
        await AssignmentSubmission.deleteMany({});
        await SupportRequest.deleteMany({});
        await Notification.deleteMany({});
        await Room.deleteMany({});
        console.log('Database dropped and cleared successfully!');

        // Hashing password "123456" for all users
        const hashedPassword = await bcrypt.hash('123456', 10);

        // 2. CREATE DEPARTMENTS
        console.log('Creating departments...');
        const deptCNTT = await Department.create({
            departmentId: 'CNTT',
            departmentName: 'Công nghệ thông tin'
        });
        const deptATTT = await Department.create({
            departmentId: 'ATTT',
            departmentName: 'An toàn thông tin'
        });
        console.log('Departments created successfully!');

        // 3. CREATE SEMESTERS
        console.log('Creating semesters...');
        const now = new Date();
        const startSemDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const endSemDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days in future
        const regStart = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago (OPEN)
        const regEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days in future

        const activeSemester = await Semester.create({
            semesterId: '20252',
            semesterName: 'Học kỳ II năm học 2025-2026',
            startDate: startSemDate,
            endDate: endSemDate,
            registrationStartDate: regStart,
            registrationEndDate: regEnd,
            isActive: true
        });
        console.log('Semesters created successfully!');

        // 4. CREATE SUBJECTS
        console.log('Creating subjects...');
        const subWeb = await Subject.create({ subjectId: 'INT1340', subjectName: 'Lập trình Web', credits: 3 });
        const subCSDL = await Subject.create({ subjectId: 'INT1341', subjectName: 'Cơ sở dữ liệu', credits: 3 });
        const subMMT = await Subject.create({ subjectId: 'INT1342', subjectName: 'Mạng máy tính', credits: 3 });
        const subATN = await Subject.create({ subjectId: 'INT1343', subjectName: 'An toàn mạng', credits: 3 });
        console.log('Subjects created successfully!');

        // 4.5. CREATE ROOMS
        console.log('Creating rooms...');
        const roomB302 = await Room.create({ roomId: 'B302', roomType: 'theory' });
        const roomA2_304 = await Room.create({ roomId: 'A2-304', roomType: 'theory' });
        const roomA2_303 = await Room.create({ roomId: 'A2-303', roomType: 'theory' });
        const roomA2_302 = await Room.create({ roomId: 'A2-302', roomType: 'theory' });
        const roomA2_301 = await Room.create({ roomId: 'A2-301', roomType: 'theory' });
        console.log('Rooms created successfully!');

        // 5. CREATE USERS
        console.log('Creating users...');
        // Admin
        const adminUser = await User.create({
            userId: 'ADMIN01',
            fullName: 'Quản trị viên Hệ thống',
            email: 'admin@ptit.edu.vn',
            password: hashedPassword,
            role: 'admin',
            dateOfBirth: new Date('1990-01-01')
        });

        // 3 Instructors
        const ins1 = await User.create({
            userId: 'GV01',
            fullName: 'Nguyễn Văn Hùng',
            email: 'hungnv@ptit.edu.vn',
            password: hashedPassword,
            role: 'instructor',
            department: deptCNTT._id,
            dateOfBirth: new Date('1980-05-12')
        });
        const ins2 = await User.create({
            userId: 'GV02',
            fullName: 'Trần Thị Thuỷ',
            email: 'thuytt@ptit.edu.vn',
            password: hashedPassword,
            role: 'instructor',
            department: deptCNTT._id,
            dateOfBirth: new Date('1985-08-24')
        });
        const ins3 = await User.create({
            userId: 'GV03',
            fullName: 'Lê Hoàng Minh',
            email: 'minhlh@ptit.edu.vn',
            password: hashedPassword,
            role: 'instructor',
            department: deptATTT._id,
            dateOfBirth: new Date('1978-11-30')
        });

        // 10 Students from studentDataList
        const studentDataList = [
          { userId: 'B24DCAT003', fullName: 'Trần Huy Quốc An', dateOfBirth: '2006-05-12', managementClass: 'D24CQAT03-B', departmentName: 'An toàn thông tin' },
          { userId: 'B24DCAT006', fullName: 'Đoàn Duy Anh', dateOfBirth: '2006-08-21', managementClass: 'D24CQAT03-B', departmentName: 'An toàn thông tin' },
          { userId: 'B24DCCN340', fullName: 'Đinh Bảo Lâm', dateOfBirth: '2006-01-15', managementClass: 'D24CQCN10-B', departmentName: 'Công nghệ thông tin' },
          { userId: 'B24DCCN349', fullName: 'Nguyễn Phương Linh', dateOfBirth: '2006-11-03', managementClass: 'D24CQCN08-B', departmentName: 'Công nghệ thông tin' },
          { userId: 'B24DCCN102', fullName: 'Lê Nguyễn Hoàng Long', dateOfBirth: '2006-02-28', managementClass: 'D24CQCN02-B', departmentName: 'Công nghệ thông tin' },
          { userId: 'B24DCCN215', fullName: 'Phạm Thị Thu Thảo', dateOfBirth: '2006-07-19', managementClass: 'D24CQCN05-B', departmentName: 'Công nghệ thông tin' },
          { userId: 'B24DCAT042', fullName: 'Vũ Tiến Đạt', dateOfBirth: '2006-09-05', managementClass: 'D24CQAT01-B', departmentName: 'An toàn thông tin' },
          { userId: 'B24DCCN088', fullName: 'Bùi Văn Hoàng', dateOfBirth: '2006-12-10', managementClass: 'D24CQCN03-B', departmentName: 'Công nghệ thông tin' },
          { userId: 'B24DCAT091', fullName: 'Đặng Ngọc Ánh', dateOfBirth: '2006-04-25', managementClass: 'D24CQAT02-B', departmentName: 'An toàn thông tin' },
          { userId: 'B24DCCN401', fullName: 'Trịnh Tuấn Kiệt', dateOfBirth: '2006-03-30', managementClass: 'D24CQCN11-B', departmentName: 'Công nghệ thông tin' }
        ];

        const students = [];
        for (const item of studentDataList) {
            const email = `${item.userId.toLowerCase()}@student.ptit.edu.vn`;
            const department = item.departmentName === 'Công nghệ thông tin' ? deptCNTT._id : deptATTT._id;
            const parsedDob = new Date(item.dateOfBirth);

            const student = await User.create({
                userId: item.userId,
                fullName: item.fullName,
                email,
                password: hashedPassword,
                role: 'student',
                managementClass: item.managementClass,
                department,
                dateOfBirth: parsedDob
            });
            students.push(student);
        }
        console.log('Users (Admin, Instructors, Students) created successfully!');

        // 6. CREATE CLASSES (5 classes total)
        console.log('Creating classes...');
        const class1 = await Class.create({
            classId: 'INT1340-02',
            subject: subWeb._id,
            instructor: ins2._id,
            semester: activeSemester._id,
            startDate: new Date('2026-02-02'),
            endDate: new Date('2026-04-05'),
            schedules: [{ dayOfWeek: 2, startPeriod: 1, endPeriod: 5, room: roomB302._id }],
            room: 'B302',
            maxStudents: 40,
            currentStudents: 0
        });

        const class2 = await Class.create({
            classId: 'INT1343-01',
            subject: subATN._id,
            instructor: ins3._id,
            semester: activeSemester._id,
            startDate: new Date('2026-02-02'),
            endDate: new Date('2026-05-17'),
            schedules: [{ dayOfWeek: 5, startPeriod: 7, endPeriod: 9, room: roomA2_304._id }],
            room: 'A2-304',
            maxStudents: 35,
            currentStudents: 0
        });

        const class3 = await Class.create({
            classId: 'INT1342-01',
            subject: subMMT._id,
            instructor: ins1._id,
            semester: activeSemester._id,
            startDate: new Date('2026-02-02'),
            endDate: new Date('2026-05-17'),
            schedules: [{ dayOfWeek: 4, startPeriod: 1, endPeriod: 3, room: roomA2_303._id }],
            room: 'A2-303',
            maxStudents: 40,
            currentStudents: 0
        });

        const class4 = await Class.create({
            classId: 'INT1341-01',
            subject: subCSDL._id,
            instructor: ins2._id,
            semester: activeSemester._id,
            startDate: new Date('2026-02-02'),
            endDate: new Date('2026-05-17'),
            schedules: [{ dayOfWeek: 3, startPeriod: 4, endPeriod: 6, room: roomA2_302._id }],
            room: 'A2-302',
            maxStudents: 45,
            currentStudents: 0
        });

        const class5 = await Class.create({
            classId: 'INT1340-01',
            subject: subWeb._id,
            instructor: ins1._id,
            semester: activeSemester._id,
            startDate: new Date('2026-02-02'),
            endDate: new Date('2026-05-17'),
            schedules: [{ dayOfWeek: 2, startPeriod: 1, endPeriod: 3, room: roomA2_301._id }],
            room: 'A2-301',
            maxStudents: 40,
            currentStudents: 0
        });
        console.log('Classes created successfully!');

        // 7. CREATE ENROLLMENTS & TUITIONS
        console.log('Creating enrollments & tuition fee records...');
        // Enroll students:
        // Class 1 (Lap trinh Web) gets students 1-6
        // Class 2 (CSDL) gets students 3-8
        // Class 3 (Mang may tinh) gets students 1-4
        // Class 4 (An toan mang) gets students 7-10
        // Class 5 (Lap trinh Web 2) gets students 8-10

        const enrollmentList = [
            { student: students[0], classObj: class1, hasGrades: true, attendance: 10, midterm: 8, final: 9 }, // Web
            { student: students[1], classObj: class1, hasGrades: true, attendance: 9.5, midterm: 7, final: 8.5 }, // Web
            { student: students[2], classObj: class1, hasGrades: false }, // Web
            { student: students[3], classObj: class1, hasGrades: false }, // Web
            { student: students[4], classObj: class1, hasGrades: false }, // Web
            { student: students[5], classObj: class1, hasGrades: false }, // Web

            { student: students[2], classObj: class2, hasGrades: true, attendance: 5, midterm: 6, final: 5.5 }, // CSDL
            { student: students[3], classObj: class2, hasGrades: false }, // CSDL
            { student: students[4], classObj: class2, hasGrades: false }, // CSDL
            { student: students[5], classObj: class2, hasGrades: false }, // CSDL
            { student: students[6], classObj: class2, hasGrades: false }, // CSDL
            { student: students[7], classObj: class2, hasGrades: false }, // CSDL

            { student: students[0], classObj: class3, hasGrades: false }, // MMT
            { student: students[1], classObj: class3, hasGrades: false }, // MMT
            { student: students[2], classObj: class3, hasGrades: false }, // MMT
            { student: students[3], classObj: class3, hasGrades: false }, // MMT

            { student: students[6], classObj: class4, hasGrades: false }, // ATN
            { student: students[7], classObj: class4, hasGrades: false }, // ATN
            { student: students[8], classObj: class4, hasGrades: false }, // ATN
            { student: students[9], classObj: class4, hasGrades: false }, // ATN

            { student: students[7], classObj: class5, hasGrades: false }, // Web 2
            { student: students[8], classObj: class5, hasGrades: false }, // Web 2
            { student: students[9], classObj: class5, hasGrades: false }  // Web 2
        ];

        const classCounts = {};

        for (const item of enrollmentList) {
            const { student, classObj, hasGrades, attendance, midterm, final } = item;
            
            // Generate mock grades for everyone to ensure the system is fully populated
            const att = hasGrades ? attendance : Math.round((7 + Math.random() * 3) * 10) / 10;
            const mid = hasGrades ? midterm : Math.round((5 + Math.random() * 5) * 10) / 10;
            const fin = hasGrades ? final : Math.round((4 + Math.random() * 6) * 10) / 10;

            const total = (att * 0.1) + (mid * 0.2) + (fin * 0.7);
            const totalScore = Math.round(total * 10) / 10;
            
            let letterGrade = null;
            if (total >= 8.95) letterGrade = 'A+';
            else if (total >= 8.45) letterGrade = 'A';
            else if (total >= 7.95) letterGrade = 'B+';
            else if (total >= 6.95) letterGrade = 'B';
            else if (total >= 6.45) letterGrade = 'C+';
            else if (total >= 5.45) letterGrade = 'C';
            else if (total >= 4.95) letterGrade = 'D+';
            else if (total >= 3.95) letterGrade = 'D';
            else letterGrade = 'F';

            const statusVal = total >= 3.95 ? 'Đạt' : 'Không đạt';

            const gradesObj = {
                attendance: att,
                midterm: mid,
                final: fin,
                total: totalScore,
                letterGrade
            };

            await Enrollment.create({
                student: student._id,
                class: classObj._id,
                semester: activeSemester._id,
                grades: gradesObj,
                attendanceScore: att,
                midtermScore: mid,
                finalScore: fin,
                totalScore,
                letterGrade,
                status: statusVal
            });

            // Increment currentStudents mapping count
            classCounts[classObj._id.toString()] = (classCounts[classObj._id.toString()] || 0) + 1;
        }

        // Apply atomic capacities to Class models
        for (const classIdStr of Object.keys(classCounts)) {
            await Class.findByIdAndUpdate(classIdStr, { currentStudents: classCounts[classIdStr] });
        }
        console.log('Enrollments created and capacities updated successfully!');

        // Tuition Fee generation (each credit is 400,000 VND)
        console.log('Generating tuition records for 10 students...');
        for (let i = 0; i < 10; i++) {
            const studentId = students[i]._id;
            
            // Get student enrollments to calculate credit sum
            const studentEnrollments = enrollmentList.filter(item => item.student._id.toString() === studentId.toString());
            let creditsSum = 0;
            for (const item of studentEnrollments) {
                // Determine credits based on subject
                if (item.classObj.subject.toString() === subWeb._id.toString()) creditsSum += 3;
                else if (item.classObj.subject.toString() === subCSDL._id.toString()) creditsSum += 3;
                else if (item.classObj.subject.toString() === subMMT._id.toString()) creditsSum += 3;
                else if (item.classObj.subject.toString() === subATN._id.toString()) creditsSum += 3;
            }
            if (creditsSum === 0) creditsSum = 9; // default backup credits

            const fee = creditsSum * 420000; // 420K VND per credit
            const isPaid = i % 3 === 0; // i=0,3,6,9 paid; others unpaid
            const paid = isPaid ? fee : 0;
            const debt = isPaid ? 0 : fee;
            const status = isPaid ? 'paid' : 'unpaid';

            await Tuition.create({
                student: studentId,
                semester: activeSemester._id,
                totalFee: fee,
                discount: 0,
                payableAmount: fee,
                paidAmount: paid,
                debtAmount: debt,
                status
            });
        }
        console.log('Tuitions generated successfully!');

        // 8. CREATE ATTENDANCE RECORDS (2 days of attendance for Class 1)
        console.log('Creating attendance records for Class 1...');
        const date1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        date1.setHours(0, 0, 0, 0);
        const date2 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
        date2.setHours(0, 0, 0, 0);

        // Class 1 has students: B24DCCN001 - B24DCCN006
        const class1Students = students.slice(0, 6);

        await Attendance.create({
            class: class1._id,
            date: date1,
            records: [
                { student: class1Students[0]._id, status: 'present' },
                { student: class1Students[1]._id, status: 'present' },
                { student: class1Students[2]._id, status: 'present' },
                { student: class1Students[3]._id, status: 'excused' },
                { student: class1Students[4]._id, status: 'present' },
                { student: class1Students[5]._id, status: 'absent' }
            ]
        });

        await Attendance.create({
            class: class1._id,
            date: date2,
            records: [
                { student: class1Students[0]._id, status: 'present' },
                { student: class1Students[1]._id, status: 'present' },
                { student: class1Students[2]._id, status: 'absent' },
                { student: class1Students[3]._id, status: 'present' },
                { student: class1Students[4]._id, status: 'present' },
                { student: class1Students[5]._id, status: 'present' }
            ]
        });
        console.log('Attendance records created successfully!');

        // 9. COURSE MATERIALS & SUBMISSIONS
        console.log('Creating course materials...');
        const materialSlide = await CourseMaterial.create({
            class: class1._id,
            instructor: ins1._id,
            title: 'Bài giảng Chương 1 - Tổng quan Lập trình Web',
            description: 'Tải slide bài giảng chương 1 giới thiệu HTML, CSS, JavaScript',
            type: 'lecture',
            fileUrl: 'http://localhost:5000/uploads/chuong1_tongquan.pdf'
        });

        const materialAssignment = await CourseMaterial.create({
            class: class1._id,
            instructor: ins1._id,
            title: 'Bài tập lớn số 1 - Thiết kế giao diện Web bán hàng',
            description: 'Yêu cầu: Thiết kế giao diện HTML/CSS đáp ứng (responsive)',
            type: 'assignment',
            fileUrl: 'http://localhost:5000/uploads/baitap1_yeucau.pdf',
            dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days in future
        });

        // 2 submissions from enrolled students (Student 1 and Student 2)
        await AssignmentSubmission.create({
            assignment: materialAssignment._id,
            student: class1Students[0]._id,
            fileUrl: 'http://localhost:5000/uploads/B24DCCN001_baitap1.zip',
            submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        });

        await AssignmentSubmission.create({
            assignment: materialAssignment._id,
            student: class1Students[1]._id,
            fileUrl: 'http://localhost:5000/uploads/B24DCCN002_baitap1.zip',
            submittedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
        });
        console.log('Course materials and submissions created successfully!');

        // 10. SUPPORT REQUESTS
        console.log('Creating support requests...');
        // Request 1: to Admin
        await SupportRequest.create({
            student: students[0]._id,
            title: 'Lỗi thẻ bảo hiểm y tế sinh viên',
            content: 'Em chưa nhận được thẻ BHYT học kỳ mới, kính mong nhà trường kiểm tra giúp.',
            recipientType: 'admin',
            relatedClass: null,
            status: 'pending'
        });

        // Request 2: to Instructor linked to Class 1
        await SupportRequest.create({
            student: students[1]._id,
            title: 'Phúc khảo điểm thi giữa kỳ học phần Lập trình Web',
            content: 'Em làm bài đầy đủ nhưng điểm số trả ra không khớp với bài em đã nộp. Thầy vui lòng xem lại giúp em ạ.',
            recipientType: 'instructor',
            relatedClass: class1._id,
            status: 'pending'
        });
        console.log('Support requests created successfully!');

        // 11. NOTIFICATIONS
        console.log('Creating global notifications...');
        await Notification.create({
            title: 'Thông báo V/v đăng ký tín chỉ học kỳ mới',
            content: 'Cổng thông tin mở đăng ký tín chỉ từ 5 ngày trước đến 10 ngày tới. Học viên vui lòng hoàn tất đúng thời hạn.',
            targetAudience: 'all',
            author: adminUser._id
        });

        await Notification.create({
            title: 'Kế hoạch học tập quân sự khoá D24',
            content: 'Yêu cầu toàn bộ sinh viên khoá D24 có mặt tại hội trường lớn lúc 8:00 ngày thứ Hai tới để nghe phổ biến quy chế.',
            targetAudience: 'student',
            author: adminUser._id
        });
        console.log('Global notifications created successfully!');

        console.log('Database seeding process completed successfully!');
        mongoose.connection.close();
        console.log('Mongoose connection closed cleanly.');
    } catch (err) {
        console.error('Error during seeding database:', err);
        mongoose.connection.close();
    }
}

seedDatabase();
