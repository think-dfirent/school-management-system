import { useState, useEffect } from "react";
import { Key, AlertTriangle, User, Mail, Calendar, X, CheckCircle } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const UserProfile = () => {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const isOpen = useAuthStore((state) => state.isProfileOpen);
  const setIsOpen = useAuthStore((state) => state.setProfileOpen);
  const setChangePasswordOpen = useAuthStore(
    (state) => state.setChangePasswordOpen,
  );

  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 5000);
  };

  useEffect(() => {
    if (!isOpen || !token) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://localhost:5000/api/users/profile",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setProfile(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          showToast(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
            "error",
          );
        } else {
          const msg =
            err.response?.data?.message ||
            "Không thể tải dữ liệu lúc này, vui lòng thử lại sau.";
          showToast(msg, "error");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isOpen, token]);

  if (!isOpen) return null;

  const formatDOB = (dobStr) => {
    if (!dobStr) return "-";
    const d = new Date(dobStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const translateRole = (role) => {
    switch (role) {
      case "admin":
        return "Quản trị viên (Admin)";
      case "instructor":
        return "Giảng viên (Instructor)";
      case "student":
        return "Sinh viên (Student)";
      default:
        return "Người dùng";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      
      {/* Toast Alerts */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center px-4 py-3 rounded-md shadow-2xl transition-all duration-300 ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span className="mr-2">
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Enterprise Profile Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-md p-6 shadow-xl relative text-DEFAULT animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-muted hover:text-DEFAULT transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted text-sm font-medium animate-pulse">
              Đang tải thông tin...
            </span>
          </div>
        ) : !profile ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-sm font-bold text-muted mt-3">
              Lỗi tải dữ liệu
            </h3>
            <p className="text-muted mt-1 text-xs">
              Không thể nạp hồ sơ của người dùng lúc này.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Avatar card details */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-border">
              <div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center text-2xl font-black text-DEFAULT shadow-inner">
                {profile.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <h2 className="text-lg font-bold text-DEFAULT mt-3">
                {profile.fullName}
              </h2>
              <span className="text-[10px] font-semibold text-primary mt-1.5 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {translateRole(profile.role)}
              </span>
            </div>

            {/* Roster fields using exact Icon layouts */}
            <div className="space-y-3.5 text-xs text-DEFAULT">
              
              {/* Full Name */}
              <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-md">
                <User size={16} className="text-muted flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase text-muted tracking-wider block mb-0.5">
                    Họ và tên
                  </span>
                  <span className="font-bold text-DEFAULT">
                    {profile.fullName}
                  </span>
                </div>
              </div>

              {/* Account */}
              <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-md">
                <Key size={16} className="text-muted flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase text-muted tracking-wider block mb-0.5">
                    Tài khoản (Mã định danh)
                  </span>
                  <span className="font-bold text-DEFAULT font-mono select-all">
                    {profile.userId}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-md">
                <Mail size={16} className="text-muted flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase text-muted tracking-wider block mb-0.5">
                    Hòm thư cá nhân
                  </span>
                  <span className="font-semibold text-DEFAULT font-mono">
                    {profile.email}
                  </span>
                </div>
              </div>

              {/* DOB */}
              <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-md">
                <Calendar size={16} className="text-muted flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase text-muted tracking-wider block mb-0.5">
                    Ngày sinh
                  </span>
                  <span className="font-semibold text-DEFAULT font-mono">
                    {formatDOB(profile.dateOfBirth)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-md transition duration-150 flex items-center justify-center gap-1.5 border-none cursor-pointer"
              >
                <Key size={14} />
                Đổi mật khẩu
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 bg-transparent hover:bg-background border border-border text-muted hover:text-DEFAULT font-bold text-xs rounded-md transition duration-150 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
