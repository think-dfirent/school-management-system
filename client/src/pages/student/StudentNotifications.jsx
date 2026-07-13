import { useState, useEffect } from "react";
import { MapPin, RefreshCw, Calendar, Bell, X, UserCheck } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const StudentNotifications = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Fetch personal alerts matching student target role
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/notifications/my-notifications",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications(response.data || []);
    } catch (err) {
      console.error("Lỗi khi tải thông báo hệ thống:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchNotifications();
  }, [token]);

  // Helper: format ISO dates into DD/MM/YYYY HH:mm
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Helper: Truncate content to 100 characters + '...'
  const getExcerpt = (text) => {
    if (!text) return "";
    if (text.length <= 100) return text;
    return text.substring(0, 100) + "...";
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-background text-DEFAULT transition-colors duration-150">
      
      {/* Dashboard Alerts main content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
              Thông Báo Từ Ban Quản Trị
            </h1>
            <p className="text-muted mt-1 text-sm">
              Xem các chỉ thị học tập, thông báo phòng học và hướng dẫn giảng dạy mới nhất của nhà trường
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/student/schedule")}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-surface hover:bg-background border border-border rounded-md transition duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <Calendar size={12} />
              Lịch học
            </button>
            <button
              onClick={fetchNotifications}
              className="px-3 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-surface hover:bg-background border border-border rounded-md transition duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              Cập nhật
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3 bg-surface border border-border rounded-md animate-pulse">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium">
              Đang nạp các thông báo đào tạo...
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-surface border border-border border-dashed rounded-md p-20 flex flex-col items-center justify-center text-center shadow-sm">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">
              Không có thông báo mới
            </h3>
            <p className="text-muted mt-2 text-sm">
              Hiện tại chưa có thông báo mới.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => setSelectedNotif(notif)}
                className="bg-background/50 hover:bg-background border border-border border-l-4 border-primary rounded-md p-5 shadow-sm cursor-pointer transition duration-150 transform hover:scale-[1.005] hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    <h3 className="font-extrabold text-DEFAULT text-sm tracking-wide leading-snug">
                      {notif.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed pl-4">
                    {getExcerpt(notif.content)}
                  </p>
                </div>
                <div className="flex flex-col md:items-end text-xs text-muted font-mono gap-1 self-stretch md:self-auto justify-end md:justify-center border-t md:border-t-0 border-border pt-2.5 md:pt-0">
                  <span className="text-DEFAULT font-semibold pl-4 md:pl-0 flex items-center gap-1">
                    <MapPin size={12} className="text-primary" /> Ban Đào tạo
                  </span>
                  <span className="pl-4 md:pl-0">
                    {formatDate(notif.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto">
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
              <div className="flex items-center gap-4 text-[11px] text-muted font-mono mt-2.5">
                <span className="flex items-center gap-1">
                  <UserCheck size={12} /> Người đăng:
                  <span className="text-DEFAULT font-semibold">
                    {selectedNotif.author?.fullName || "Ban Đào tạo"}
                  </span>
                </span>
                <span>|</span>
                <span>Đăng lúc: {formatDate(selectedNotif.createdAt)}</span>
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

export default StudentNotifications;
