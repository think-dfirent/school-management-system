import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

const InstructorRedirect = ({ tab }) => {
    const { classId } = useParams();
    return <Navigate to={`/instructor/classes/${classId}?tab=${tab}`} replace />;
};

import Login from './pages/auth/Login';
import ProtectedRoute from './components/ui/ProtectedRoute';
import SubjectManagement from './pages/admin/SubjectManagement';
import UserManagement from './pages/admin/UserManagement';
import AdminGradeManagement from './pages/admin/AdminGradeManagement';
import ClassManagement from './pages/admin/ClassManagement';
import CreateClassForm from './pages/admin/CreateClassForm';
import NotificationManagement from './pages/admin/NotificationManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import SemesterManagement from './pages/admin/SemesterManagement';
import AdminSupportRequests from './pages/admin/AdminSupportRequests';
import InstructorSupportRequests from './pages/instructor/InstructorSupportRequests';
import ClassAttendance from './pages/student/ClassAttendance';
import CourseContentManagement from './pages/instructor/CourseContentManagement';
import ClassDashboard from './pages/student/ClassDashboard';
import StudentClassDashboard from './pages/student/StudentClassDashboard';
import StudentSupport from './pages/student/StudentSupport';
import CourseRegistration from './pages/student/CourseRegistration';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentGrades from './pages/student/StudentGrades';
import StudentTuition from './pages/student/StudentTuition';
import StudentNotifications from './pages/student/StudentNotifications';
import InstructorSchedule from './pages/instructor/InstructorSchedule';
import InstructorGradeEntry from './pages/instructor/InstructorGradeEntry';
import InstructorClassList from './pages/instructor/InstructorClassList';
import InstructorStudentList from './pages/instructor/InstructorStudentList';
import StudentDashboard from './pages/student/StudentDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import GlobalLayout from './components/ui/GlobalLayout';
function App() {
  return (
    <Router>
      <Routes>
        {/* Điều hướng mặc định vào trang login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Trang đăng nhập */}
        <Route path="/login" element={<Login />} />
        
        {/* Layout chung cho các trang đã đăng nhập */}
        <Route element={<GlobalLayout />}>
            {/* Quản lý môn học (Admin) */}
            <Route 
              path="/admin/subjects" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SubjectManagement />
                </ProtectedRoute>
              } 
            />

            {/* Quản lý người dùng (Admin) */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />

            {/* Quản lý điểm số (Admin) */}
            <Route 
              path="/admin/grades" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminGradeManagement />
                </ProtectedRoute>
              } 
            />

            {/* Quản lý lớp học phần (Admin) */}
            <Route 
              path="/admin/classes" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ClassManagement />
                </ProtectedRoute>
              } 
            />

            {/* Mở lớp học phần (Admin) */}
            <Route 
              path="/admin/classes/create" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CreateClassForm />
                </ProtectedRoute>
              } 
            />

            {/* Quản lý thông báo (Admin) */}
            <Route 
              path="/admin/notifications" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <NotificationManagement />
                </ProtectedRoute>
              } 
            />

            {/* Quản lý học kỳ (Admin) */}
            <Route 
              path="/admin/semesters" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SemesterManagement />
                </ProtectedRoute>
              } 
            />

            {/* Giải quyết yêu cầu hỗ trợ (Admin) */}
            <Route 
              path="/admin/support" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSupportRequests />
                </ProtectedRoute>
              } 
            />

            {/* Đăng ký môn học (Student) */}
            <Route 
              path="/student/registration" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CourseRegistration />
                </ProtectedRoute>
              } 
            />

            {/* Xem thời khóa biểu (Student) */}
            <Route 
              path="/student/schedule" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSchedule />
                </ProtectedRoute>
              } 
            />

            {/* Xem điểm tổng kết (Student) */}
            <Route 
              path="/student/grades" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentGrades />
                </ProtectedRoute>
              } 
            />

            {/* Xem học phí (Student) */}
            <Route 
              path="/student/tuition" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentTuition />
                </ProtectedRoute>
              } 
            />

            {/* Xem thông báo (Student) */}
            <Route 
              path="/student/notifications" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentNotifications />
                </ProtectedRoute>
              } 
            />

            {/* Gửi yêu cầu hỗ trợ (Student) */}
            <Route 
              path="/student/support" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSupport />
                </ProtectedRoute>
              } 
            />

            {/* Unified Class Space Dashboard (Student) */}
            <Route 
              path="/student/classes/:classId" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentClassDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Xem lịch dạy (Instructor) */}
            <Route 
              path="/instructor/schedule" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorSchedule />
                </ProtectedRoute>
              } 
            />

            {/* Nhập/Sửa điểm (Instructor) - Chi tiết */}
            <Route 
              path="/instructor/grades/:classId" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorRedirect tab="grades" />
                </ProtectedRoute>
              } 
            />

            {/* Xem danh sách học viên (Instructor) */}
            <Route 
              path="/instructor/classes/:classId/students" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorStudentList />
                </ProtectedRoute>
              } 
            />

            {/* Nhập/Sửa điểm (Instructor) - Danh sách lớp */}
            <Route 
              path="/instructor/grades" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorClassList />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/instructor/class-list" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorClassList />
                </ProtectedRoute>
              } 
            />

            {/* Giải quyết yêu cầu hỗ trợ (Instructor) */}
            <Route 
              path="/instructor/support" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorSupportRequests />
                </ProtectedRoute>
              } 
            />

            {/* Điểm danh học viên (Instructor) */}
            <Route 
              path="/instructor/attendance/:classId" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorRedirect tab="attendance" />
                </ProtectedRoute>
              } 
            />

            {/* Quản lý học liệu học phần (Instructor) */}
            <Route 
              path="/instructor/materials/:classId" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorRedirect tab="materials" />
                </ProtectedRoute>
              } 
            />

            {/* Unified Class Space Dashboard (Instructor) */}
            <Route 
              path="/instructor/classes/:classId" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <ClassDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/instructor/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<div className="flex items-center justify-center h-screen text-xl font-bold text-red-500">404 - Trang không tồn tại</div>} />
      </Routes>
    </Router>
  );
}

export default App;