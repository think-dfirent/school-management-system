import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  BarChart3,
  Wallet,
  School,
  Calendar,
  BookOpen,
  Megaphone,
  Mail,
  UserCheck,
  X,
} from "lucide-react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // Dashboard State
  const [gpa, setGpa] = useState(0);
  const [debt, setDebt] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [gradesRes, tuitionRes, notifRes] = await Promise.all([
        axios.get("http://localhost:5000/api/grades/my-grades", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/tuition/my-tuition", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/notifications/my-notifications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setGpa(gradesRes.data?.gpa || 0);
      setClassCount(gradesRes.data?.grades?.length || 0);
      setDebt(tuitionRes.data?.grandTotal?.debtAmount || 0);
      setNotifications((notifRes.data || []).slice(0, 3));
    } catch (err) {
      console.error("Lỗi khi nạp dữ liệu dashboard sinh viên:", err);
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

  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8 text-DEFAULT">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-DEFAULT">
            Học kỳ 1 Năm học 2026 - 2027
          </h1>
          <p className="text-xs text-muted mt-1">
            Niên khóa K24 ĐTCN | Sinh viên: {currentUser?.fullName}
          </p>
        </div>
        <div className="text-xs text-muted bg-background px-3 py-2 rounded-md border border-border font-mono">
          Lần đăng nhập hiện tại: {new Date().toLocaleDateString("vi-VN")}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted font-medium">
            Đang đồng bộ cơ sở dữ liệu học tập...
          </span>
        </div>
      ) : (
        <>
          {/* KPI Cards section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* GPA */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors duration-150">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Điểm tích lũy hệ 4
                </span>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black font-mono text-DEFAULT">
                  {gpa.toFixed(2)}
                </span>
                <span className="text-xs text-muted pl-1">/ 4.0</span>
              </div>
            </div>

            {/* Tuition debt */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors duration-150">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Học phí cần hoàn thành
                </span>
                <Wallet className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-4">
                <span
                  className={`text-2xl font-black font-mono ${debt > 0 ? "text-rose-500" : "text-DEFAULT"}`}
                >
                  {formatVND(debt)}
                </span>
              </div>
            </div>

            {/* Class registration count */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors duration-150">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Lớp học phần đã đăng ký
                </span>
                <School className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black font-mono text-DEFAULT">
                  {classCount}
                </span>
                <span className="text-xs text-muted pl-1">Lớp</span>
              </div>
            </div>
          </div>

          {/* Quick links portal grids */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider pl-1">
              Phân hệ tính năng học tập
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Timetable */}
              <div
                onClick={() => navigate("/student/schedule")}
                className="bg-surface hover:bg-background border border-border hover:border-primary/30 p-5 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
              >
                <Calendar className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-bold text-DEFAULT">
                  Lịch Học Tuần
                </span>
              </div>

              {/* Register */}
              <div
                onClick={() => navigate("/student/registration")}
                className="bg-surface hover:bg-background border border-border hover:border-primary/30 p-5 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
              >
                <BookOpen className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-bold text-DEFAULT">
                  Đăng Ký Môn
                </span>
              </div>

              {/* Gradebook */}
              <div
                onClick={() => navigate("/student/grades")}
                className="bg-surface hover:bg-background border border-border hover:border-primary/30 p-5 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
              >
                <BarChart3 className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-bold text-DEFAULT">
                  Bảng Điểm Học Tập
                </span>
              </div>

              {/* Tuition */}
              <div
                onClick={() => navigate("/student/tuition")}
                className="bg-surface hover:bg-background border border-border hover:border-primary/30 p-5 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
              >
                <Wallet className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-bold text-DEFAULT">
                  Tra Cứu Học Phí
                </span>
              </div>

              {/* Announcements */}
              <div
                onClick={() => navigate("/student/notifications")}
                className="bg-surface hover:bg-background border border-border hover:border-primary/30 p-5 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
              >
                <Megaphone className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-bold text-DEFAULT">
                  Bản Tin Thông Báo
                </span>
              </div>

              {/* Support Desk */}
              <div
                onClick={() => navigate("/student/support")}
                className="bg-surface hover:bg-background border border-border hover:border-primary/30 p-5 rounded-md shadow-sm cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 group"
              >
                <Mail className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-bold text-DEFAULT">
                  Hỗ Trợ Học Vụ
                </span>
              </div>
            </div>
          </div>

          {/* Recent Announcements Card widget */}
          <div className="bg-surface border border-border rounded-md p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                Thông báo đào tạo mới nhất
              </h3>
              <button
                onClick={() => navigate("/student/notifications")}
                className="text-xs font-bold text-primary hover:text-primary/95 transition-colors"
              >
                Xem tất cả →
              </button>
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
                    className="py-4 flex justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-background px-2 rounded-md transition"
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

      {/* Detailed View Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-surface border border-border rounded-md w-full max-w-xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto shadow-sm">
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
                className="px-5 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-transparent border border-border hover:bg-background rounded-md transition cursor-pointer"
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

export default StudentDashboard;
