import { useState, useEffect } from "react";
import { Key, AlertTriangle, X, CheckCircle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const ChangePassword = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const isOpen = useAuthStore((state) => state.isChangePasswordOpen);
  const setIsOpen = useAuthStore((state) => state.setChangePasswordOpen);

  // States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmError, setConfirmError] = useState("");
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

  // Watch confirm password for frontend validation
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setConfirmError("Mật khẩu xác nhận không khớp!");
    } else {
      setConfirmError("");
    }
  }, [newPassword, confirmPassword]);

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setConfirmError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setConfirmError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setLoading(true);

    try {
      const response = await axios.put(
        "http://localhost:5000/api/auth/change-password",
        { currentPassword, newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showToast(
        response.data?.message || "Đổi mật khẩu thành công! Hệ thống tự động đăng xuất.",
        "success",
      );
      setTimeout(() => {
        setIsOpen(false);
        logout();
        navigate("/login");
      }, 2500);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || "Không thể đổi mật khẩu lúc này. Vui lòng thử lại sau!";
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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

      {/* Enterprise Password Modal */}
      <div className="w-full max-w-md bg-surface border border-border rounded-md p-6 shadow-xl relative text-DEFAULT animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-muted hover:text-DEFAULT transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="text-center relative mb-5">
          <Key className="w-12 h-12 text-primary mx-auto mb-2" />
          <h2 className="text-lg font-bold text-DEFAULT">Đổi Mật Khẩu</h2>
          <p className="text-muted mt-1 text-xs font-medium">
            Cập nhật mật khẩu mới để tăng cường bảo mật cho tài khoản
          </p>
        </div>

        <form className="space-y-4 relative text-left" onSubmit={handleSubmit}>
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5 pl-1">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-md text-DEFAULT text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200"
              placeholder="••••••••"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5 pl-1">
              Mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-md text-DEFAULT text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200"
              placeholder="Ít nhất 8 ký tự"
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5 pl-1">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-1 transition duration-200 ${
                confirmError
                  ? "border-primary focus:border-primary focus:ring-primary"
                  : "border-border focus:border-primary focus:ring-primary"
              }`}
              placeholder="Nhập lại mật khẩu mới"
            />
            {confirmError && (
              <span className="block text-[11px] text-primary font-semibold mt-1.5 pl-1 animate-pulse">
                <AlertTriangle size={12} className="inline-block mr-1" />
                {confirmError}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-border flex gap-3">
            <button
              type="submit"
              disabled={loading || !!confirmError}
              className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-md transition duration-150 flex items-center justify-center gap-1.5 border-none cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Cập nhật</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2.5 bg-transparent hover:bg-background border border-border text-muted hover:text-DEFAULT font-bold text-xs rounded-md transition duration-150 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
