import { useState, useEffect } from "react";
import { Megaphone, Trash2, CheckCircle, AlertTriangle, X, Plus, Edit3, MoreHorizontal } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const NotificationManagement = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Toast alert states (Hoisted to top)
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "success" });
    }, 5000);
  };

  const [validationError, setValidationError] = useState("");

  // Modal state
  const [modal, setModal] = useState({ show: false, type: "add", data: null });
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetAudience: "all",
  });

  // Delete Confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Fetch all notifications from API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/notifications",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications(response.data);
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể tải danh sách thông báo!",
        "error",
      );
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

  // Open Add/Edit Modal
  const openModal = (type, data = null) => {
    setValidationError("");

    if (type === "edit" && data) {
      setFormData({
        title: data.title || "",
        content: data.content || "",
        targetAudience: data.targetAudience || "all",
      });
      setModal({ show: true, type: "edit", data });
    } else {
      setFormData({ title: "", content: "", targetAudience: "all" });
      setModal({ show: true, type: "add", data: null });
    }
  };

  const closeModal = () => {
    setModal({ show: false, type: "add", data: null });
    setValidationError("");
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.title.trim() || !formData.content.trim()) {
      setValidationError("Tiêu đề và Nội dung thông báo không được để trống!");
      return;
    }
    try {
      if (modal.type === "add") {
        const response = await axios.post(
          "http://localhost:5000/api/notifications",
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert(
          response.data.message || "Đã phát hành thông báo mới",
          "success",
        );
      } else {
        const response = await axios.put(
          `http://localhost:5000/api/notifications/${modal.data._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert(
          response.data.message || "Cập nhật thông báo thành công!",
          "success",
        );
      }
      closeModal();
      fetchNotifications();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông báo!",
        "error",
      );
    }
  };

  // Handle Delete click
  const handleDeleteClick = (notification) => {
    setDeleteConfirm({ show: true, id: notification._id });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/notifications/${deleteConfirm.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert(
        response.data.message || "Xóa thông báo thành công!",
        "success",
      );
      setDeleteConfirm({ show: false, id: null });
      fetchNotifications();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể xóa thông báo!",
        "error",
      );
      setDeleteConfirm({ show: false, id: null });
    }
  };

  return (
    <div className="min-h-screen bg-background text-DEFAULT font-sans p-6 relative transition-colors duration-150">
      
      {/* Custom Toast Alert */}
      {alert.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center px-4 py-3 rounded-md shadow-2xl transition-all duration-300 transform translate-y-0 ${
            alert.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span className="mr-2">
            {alert.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          </span>
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
            Quản Lý Thông Báo
          </h1>
          <p className="text-muted mt-1 text-sm">
            Phát hành các tin tức, thông báo khẩn cấp hoặc lịch trình đào tạo toàn trường
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openModal("add")}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition duration-200 cursor-pointer flex items-center gap-1.5 border-none"
          >
            <Plus size={16} />
            Phát Hành Thông Báo
          </button>
        </div>
      </div>

      {/* Notifications Table Card */}
      <div className="max-w-7xl mx-auto bg-surface border border-border rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang tải danh sách thông báo...
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center">
            <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-450">
              Chưa có thông báo nào
            </h3>
            <p className="text-muted mt-1 text-sm max-w-md mx-auto">
              Vui lòng bấm "+ Phát Hành Thông Báo" để đăng tải bản tin đầu tiên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[290px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Tiêu đề</th>
                  <th className="px-6 py-4">Nội dung</th>
                  <th className="px-6 py-4">Đối tượng nhận</th>
                  <th className="px-6 py-4">Ngày đăng</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {notifications.map((notif, index) => (
                  <tr
                    key={notif._id}
                    className="hover:bg-background/80 transition duration-150"
                  >
                    <td className="py-3 px-4 align-middle font-bold text-DEFAULT max-w-xs truncate">
                      {notif.title}
                    </td>
                    <td className="py-3 px-4 align-middle text-muted max-w-sm truncate">
                      {notif.content}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap border bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20">
                        {notif.targetAudience === "all"
                          ? "Tất cả"
                          : notif.targetAudience === "student"
                            ? "Sinh viên"
                            : "Giảng viên"}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle text-muted text-xs font-mono">
                      {new Date(notif.createdAt).toLocaleDateString("vi-VN")}{" "}
                      {new Date(notif.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === notif._id ? null : notif._id)}
                          className="p-2 rounded-md text-muted hover:text-DEFAULT hover:bg-background transition-colors focus:outline-none cursor-pointer"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {openDropdownId === notif._id && (
                          <>
                            {/* Click outside backdrop */}
                            <div 
                              className="fixed inset-0 z-40 cursor-default" 
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className={`absolute right-0 w-32 bg-surface border border-border rounded-md shadow-xl z-50 overflow-hidden text-left animate-in fade-in duration-150 ${
                              index >= notifications.length - 2 && notifications.length > 2
                                ? "bottom-full mb-1 origin-bottom"
                                : "top-full mt-1 origin-top"
                            }`}>
                              <button
                                onClick={() => {
                                  openModal("edit", notif);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-muted hover:text-DEFAULT hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Sửa
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteClick(notif);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Gỡ bỏ
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Notification Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-lg p-6 transform scale-100 transition-all">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-DEFAULT">
                {modal.type === "add" ? "Phát Hành Thông Báo Mới" : "Cập Nhật Bản Tin"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-DEFAULT font-bold transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Client-Side Validation Error Alert banner */}
            {validationError && (
              <div className="mb-4 p-3 rounded bg-rose-500/10 border border-primary/25 text-xs text-primary font-medium">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Tiêu đề thông báo *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Nhập tiêu đề ngắn gọn..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Đối tượng nhận thông báo *
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAudience: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm cursor-pointer"
                >
                  <option value="all">Tất cả mọi người</option>
                  <option value="student">Sinh viên (Student)</option>
                  <option value="instructor">Giảng viên (Instructor)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Nội dung thông báo *
                </label>
                <textarea
                  required
                  rows="6"
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Nhập nội dung thông tin chi tiết phát hành..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-DEFAULT bg-surface border border-border rounded-md transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer border-none"
                >
                  {modal.type === "add" ? "Phát hành" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-sm p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-DEFAULT">
                Gỡ Bỏ Thông Báo
              </h3>
              <p className="text-sm text-muted mt-2">
                Bạn có chắc chắn muốn gỡ thông báo này không?
              </p>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-DEFAULT bg-surface border border-border rounded-md transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer border-none"
              >
                Xác nhận gỡ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
