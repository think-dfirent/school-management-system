import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  Users,
  School,
  Calendar,
  BookOpen,
  Mail,
  UserCheck,
  X,
} from "lucide-react";

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // Dashboard State
  const [classCount, setClassCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch teaching classes list
      const classesRes = await axios.get(
        "http://localhost:5000/api/schedules/teaching-schedule",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const classesList = classesRes.data || [];
      setClassCount(classesList.length);

      // 2. Fetch rosters size concurrently
      let totalStudents = 0;
      const rosters = await Promise.all(
        classesList.map((cls) =>
          axios
            .get(`http://localhost:5000/api/classes/${cls.classId}/students`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: [] })),
        ),
      );
      rosters.forEach((r) => {
        totalStudents += r.data?.length || 0;
      });
      setStudentCount(totalStudents);

      // 3. Fetch notifications feed
      const notifRes = await axios.get(
        "http://localhost:5000/api/notifications/my-notifications",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications((notifRes.data || []).slice(0, 3));
    } catch (err) {
      console.error("Lỗi khi nạp dữ liệu dashboard giảng viên:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [token]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex-1 w-full bg-background text-DEFAULT transition-colors duration-150 min-h-screen">
      <div className="max-w-5xl w-full mx-auto p-6 space-y-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-DEFAULT">
              Học kỳ 1 Năm học 2026 - 2027
            </h1>
            <p className="text-xs text-muted mt-1">
              Khoa Công nghệ Thông tin | Giảng viên: {currentUser?.fullName}
            </p>
          </div>
          <div className="text-xs text-muted bg-surface px-3 py-2 rounded-md border border-border font-mono">
            Ngày làm việc: {new Date().toLocaleDateString("vi-VN")}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3 bg-surface border border-border rounded-md shadow-sm">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang tập hợp danh sách phân công giảng dạy...
            </span>
          </div>
        ) : (
          <>
            {/* KPI Cards section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Class taught count */}
              <div className="bg-surface border border-border rounded-md p-6 shadow-sm flex flex-col justify-between hover:border-primary/30 transition duration-150">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">
                    Lớp học phần phụ trách
                  </span>
                  <School className="w-5 h-5 text-primary" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold font-mono text-DEFAULT">
                    {classCount}
                  </span>
                  <span className="text-xs text-muted pl-1">Nhóm lớp</span>
                </div>
              </div>

              {/* Managed students count */}
              <div className="bg-surface border border-border rounded-md p-6 shadow-sm flex flex-col justify-between hover:border-primary/30 transition duration-150">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">
                    Tổng số học viên quản lý
                  </span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold font-mono text-DEFAULT">
                    {studentCount}
                  </span>
                  <span className="text-xs text-muted pl-1">Sinh viên</span>
                </div>
              </div>
            </div>

            {/* Quick links portal grids */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider pl-1">
                Tính năng quản lý đào tạo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Teaching Timetable */}
                <div
                  onClick={() => navigate("/instructor/schedule")}
                  className="bg-surface hover:bg-background/60 border border-border hover:border-primary/30 p-6 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <Calendar className="w-6 h-6 text-muted group-hover:text-primary transition" />
                  <span className="text-sm font-bold text-DEFAULT">
                    Thời Khóa Biểu Giảng Dạy
                  </span>
                </div>

                {/* Gradebook management */}
                <div
                  onClick={() => navigate("/instructor/class-list")}
                  className="bg-surface hover:bg-background/60 border border-border hover:border-primary/30 p-6 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <BookOpen className="w-6 h-6 text-muted group-hover:text-primary transition" />
                  <span className="text-sm font-bold text-DEFAULT">
                    Quản Lý Lớp Học Phần
                  </span>
                </div>

                {/* Support Requests */}
                <div
                  onClick={() => navigate("/instructor/support")}
                  className="bg-surface hover:bg-background/60 border border-border hover:border-primary/30 p-6 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <Mail className="w-6 h-6 text-muted group-hover:text-primary transition" />
                  <span className="text-sm font-bold text-DEFAULT">
                    Hỗ Trợ Sinh Viên
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Announcements Card widget */}
            <div className="bg-surface border border-border rounded-md p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                  Thông báo từ ban quản trị
                </h3>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-muted text-center py-6">
                  Hiện tại chưa có thông báo mới.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => setSelectedNotif(notif)}
                      className="py-4 flex justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-background/60 px-2 rounded-md transition"
                    >
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-DEFAULT hover:text-primary transition leading-snug">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-muted truncate max-w-2xl">
                          {notif.content}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted font-mono flex-shrink-0">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-surface border border-border rounded-md shadow-xl w-full max-w-xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedNotif(null)}
              className="absolute top-4 right-4 text-muted hover:text-DEFAULT transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="border-b border-border pb-4 mb-4">
              <span className="text-[10px] font-bold tracking-wider text-muted uppercase">
                Bản tin thông báo đào tạo
              </span>
              <h2 className="text-lg font-black text-DEFAULT tracking-wide mt-1 leading-snug">
                {selectedNotif.title}
              </h2>
              <div className="flex items-center gap-4 text-[11px] text-muted font-mono mt-2">
                <span className="flex items-center gap-1">
                  <UserCheck size={12} className="text-muted" /> Đăng bởi:
                  <span className="text-DEFAULT font-semibold">
                    {selectedNotif.author?.fullName || "Ban Đào tạo"}
                  </span>
                </span>
                <span>|</span>
                <span>Ngày: {formatDate(selectedNotif.createdAt)}</span>
              </div>
            </div>
            <div className="text-DEFAULT text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto pr-1">
              {selectedNotif.content}
            </div>
            <div className="flex justify-end pt-5 border-t border-border mt-4">
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-5 py-2 text-xs font-semibold text-muted bg-transparent border border-border hover:bg-background rounded-md transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
