import { useState, useEffect } from "react";
import { Users, AlertTriangle, CheckCircle, X, Lock, Unlock, Trash2, ShieldAlert, MoreHorizontal, Edit3 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const UserManagement = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // Initial States
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Alert & Validation Error States (Hoisted to top)
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });
  
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "success" });
    }, 4500);
  };

  const [validationError, setValidationError] = useState("");

  // Modal State
  const [modal, setModal] = useState({ show: false, type: "add", data: null });
  const [formData, setFormData] = useState({
    userId: "",
    fullName: "",
    email: "",
    role: "student",
    dateOfBirth: "",
    managementClass: "",
    department: "",
  });

  // Confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    id: null,
    fullName: "",
    userId: "",
  });

  const [lockConfirm, setLockConfirm] = useState({ show: false, user: null });

  // Fetch Departments list
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/departments",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDepartments(response.data);
    } catch {
      showAlert("Không thể tải danh sách khoa từ máy chủ!", "error");
    }
  };

  // Fetch Users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/users`, {
        params: { role: roleFilter, department: deptFilter, page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });

      const { users, totalPages, currentPage, totalUsers } = response.data;
      setUsers(users);
      setTotalPages(totalPages || 1);
      setPage(currentPage || 1);
      setTotalUsers(totalUsers || 0);
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể tải danh sách người dùng!",
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
    const loadInitialData = async () => {
      await fetchDepartments();
      await fetchUsers();
    };
    loadInitialData();
  }, [token]);

  // Fetch users when filters or pages change
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [page, roleFilter, deptFilter]);

  // Open Add / Edit Modal
  const openModal = (type, data = null) => {
    setValidationError("");

    if (type === "edit" && data) {
      setFormData({
        userId: data.userId || "",
        fullName: data.fullName || "",
        email: data.email || "",
        role: data.role || "student",
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
        managementClass: data.managementClass || "",
        department: data.department?._id || "",
      });
      setModal({ show: true, type: "edit", data });
    } else {
      setFormData({
        userId: "",
        fullName: "",
        email: "",
        role: "student",
        dateOfBirth: "",
        managementClass: "",
        department: departments[0]?._id || "",
      });
      setModal({ show: true, type: "add", data: null });
    }
  };

  const closeModal = () => {
    setModal({ show: false, type: "add", data: null });
    setValidationError("");
  };

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const { userId, fullName, email, role } = formData;
    if (!userId.trim() || !fullName.trim() || !email.trim() || !role) {
      setValidationError(
        "Vui lòng điền đầy đủ các thông tin bắt buộc (Mã số, Họ tên, Email, Vai trò)!",
      );
      return;
    }
    try {
      if (modal.type === "add") {
        const response = await axios.post(
          "http://localhost:5000/api/users",
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert(
          response.data.message || "Cập nhật tài khoản thành công",
          "success",
        );
      } else {
        const response = await axios.put(
          `http://localhost:5000/api/users/${modal.data._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert(
          response.data.message || "Cập nhật tài khoản thành công",
          "success",
        );
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật tài khoản!",
        "error",
      );
    }
  };

  // Lock user status handler
  const handleLockClick = (user) => {
    if (user._id === currentUser?.id || user.userId === currentUser?.userId) {
      showAlert(
        "Bạn không thể tự khóa hoặc xóa tài khoản của chính mình!",
        "error",
      );
      return;
    }
    setLockConfirm({ show: true, user });
  };

  const confirmLock = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/users/${lockConfirm.user._id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert(
        response.data.message || "Cập nhật tài khoản thành công",
        "success",
      );
      setLockConfirm({ show: false, user: null });
      fetchUsers();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể thay đổi trạng thái tài khoản!",
        "error",
      );
      setLockConfirm({ show: false, user: null });
    }
  };

  // Delete click handler
  const handleDeleteClick = (user) => {
    if (user._id === currentUser?.id || user.userId === currentUser?.userId) {
      showAlert(
        "Bạn không thể tự khóa hoặc xóa tài khoản của chính mình!",
        "error",
      );
      return;
    }
    setDeleteConfirm({
      show: true,
      id: user._id,
      fullName: user.fullName,
      userId: user.userId,
    });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/users/${deleteConfirm.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert(
        response.data.message || "Cập nhật tài khoản thành công",
        "success",
      );
      setDeleteConfirm({ show: false, id: null, fullName: "", userId: "" });

      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchUsers();
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể xóa tài khoản!",
        "error",
      );
      setDeleteConfirm({ show: false, id: null, fullName: "", userId: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-DEFAULT font-sans p-6 relative transition-colors duration-150">
      
      {/* Custom Toast Alert Banner */}
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

      {/* Header section */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
            Quản Lý Người Dùng
          </h1>
          <p className="text-muted mt-1 text-sm">
            Quản lý phân quyền, cấu trúc khoa, khóa/mở khóa tài khoản Giảng viên và Sinh viên
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Role Filter Selector */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm bg-surface border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="instructor">Giảng viên (Instructor)</option>
            <option value="student">Sinh viên (Student)</option>
          </select>

          {/* Department Filter Selector */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm bg-surface border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">Tất cả khoa</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.departmentName}
              </option>
            ))}
          </select>

          <button
            onClick={() => openModal("add")}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <Users size={16} />
            Thêm Tài Khoản
          </button>
        </div>
      </div>

      {/* Users Data Table Card */}
      <div className="max-w-7xl mx-auto bg-surface border border-border rounded-md shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang tải danh sách tài khoản...
            </span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">
              Không tìm thấy người dùng
            </h3>
            <p className="text-muted mt-1 text-sm max-w-md mx-auto">
              Không có tài khoản nào phù hợp với bộ lọc được chọn.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Mã số người dùng</th>
                    <th className="px-6 py-4">Họ và tên</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Khoa phụ trách / Lớp</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {users.map((usr) => (
                    <tr
                      key={usr._id}
                      className="hover:bg-background/80 transition duration-150"
                    >
                      <td className="py-3 px-4 align-middle font-mono text-DEFAULT font-semibold">
                        {usr.userId}
                      </td>
                      <td className="py-3 px-4 align-middle font-semibold text-DEFAULT">
                        {usr.fullName}
                        {usr.userId === currentUser?.userId && (
                          <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800 text-muted px-1.5 py-0.5 rounded border border-border font-normal">
                            Tôi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle text-muted">{usr.email}</td>
                      <td className="py-3 px-4 align-middle">
                        <div className="text-DEFAULT font-medium">
                          {usr.department?.departmentName || (
                            <span className="text-slate-500">-</span>
                          )}
                        </div>
                        {usr.role === "student" && usr.managementClass && (
                          <div className="text-xs text-muted font-mono mt-0.5">
                            Lớp: {usr.managementClass}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap border ${
                            usr.role === "admin"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20"
                          }`}
                        >
                          {usr.role === "admin"
                            ? "Admin"
                            : usr.role === "instructor"
                              ? "Giảng viên"
                              : "Sinh viên"}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap border ${
                            usr.isActive !== false
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                        >
                          {usr.isActive !== false ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle text-right relative">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === usr.userId ? null : usr.userId)}
                          className="p-2 rounded-md text-muted hover:text-DEFAULT hover:bg-background transition-colors focus:outline-none cursor-pointer"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {openDropdownId === usr.userId && (
                          <>
                            {/* Click outside backdrop */}
                            <div 
                              className="fixed inset-0 z-40 cursor-default" 
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className="absolute right-4 mt-1 w-36 bg-surface border border-border rounded-md shadow-xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-1 duration-150">
                              <button
                                onClick={() => {
                                  openModal("edit", usr);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-muted hover:text-DEFAULT hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Sửa
                              </button>
                              <button
                                onClick={() => {
                                  handleLockClick(usr);
                                  setOpenDropdownId(null);
                                }}
                                disabled={usr.userId === currentUser?.userId}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-muted hover:text-amber-500 hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent disabled:opacity-40 disabled:pointer-events-none"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                {usr.isActive !== false ? "Khóa" : "Mở khóa"}
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteClick(usr);
                                  setOpenDropdownId(null);
                                }}
                                disabled={usr.userId === currentUser?.userId}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent disabled:opacity-40 disabled:pointer-events-none"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="bg-background/30 border-t border-border px-6 py-4 flex justify-between items-center text-sm text-muted">
              <div>
                Hiển thị <span className="font-semibold text-DEFAULT">{users.length}</span> / <span className="font-semibold text-DEFAULT">{totalUsers}</span> tài khoản
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-surface hover:bg-background border border-border text-DEFAULT rounded-md disabled:opacity-40 transition cursor-pointer"
                >
                  Trước
                </button>
                <span className="px-4 py-1 bg-surface border border-border rounded-md text-DEFAULT font-bold font-mono">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-surface hover:bg-background border border-border text-DEFAULT rounded-md disabled:opacity-40 transition cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit User Modal Dialog */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-DEFAULT">
                {modal.type === "add" ? "Thêm Tài Khoản Mới" : "Cập Nhật Tài Khoản"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-DEFAULT font-bold transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Validation Error Alert Banner */}
            {validationError && (
              <div className="mb-4 p-3 rounded bg-rose-500/10 border border-primary/25 text-xs text-primary font-medium">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Mã số người dùng (userId) *
                </label>
                <input
                  type="text"
                  required
                  disabled={modal.type === "edit"}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 font-mono text-sm"
                  placeholder="Ví dụ: K24DTCN001"
                  value={formData.userId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      userId: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="email@ptit.edu.vn"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Vai trò hệ thống *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm cursor-pointer"
                >
                  <option value="student">Sinh viên (Student)</option>
                  <option value="instructor">Giảng viên (Instructor)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Khoa / Bộ môn *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm cursor-pointer"
                >
                  <option value="">-- Chọn Khoa --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Ngày sinh (Date of Birth)
                </label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>
              {formData.role === "student" && (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Lớp sinh hoạt (Ví dụ: D24CQCN01) *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm uppercase"
                    placeholder="Nhập lớp quản lý"
                    value={formData.managementClass}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        managementClass: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              )}
              {modal.type === "add" && (
                <p className="text-[11px] text-muted italic">
                  * Mật khẩu mặc định của tài khoản tạo mới sẽ tự động hash và gán là <span className="font-bold font-mono text-muted">123456</span>.
                </p>
              )}
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-DEFAULT bg-surface rounded-md border border-border transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer"
                >
                  {modal.type === "add" ? "Thêm mới" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock Confirmation Modal */}
      {lockConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-sm p-6">
            <div className="text-center">
              <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-DEFAULT">
                {lockConfirm.user?.isActive !== false ? "Xác Nhận Khóa Tài Khoản" : "Xác Nhận Mở Khóa Tài Khoản"}
              </h3>
              <p className="text-sm text-muted mt-2">
                Bạn có chắc chắn muốn {lockConfirm.user?.isActive !== false ? "khóa" : "mở khóa"} tài khoản của người dùng{" "}
                <span className="font-bold text-DEFAULT">{lockConfirm.user?.fullName}</span> (MS: <span className="font-mono font-bold text-DEFAULT">{lockConfirm.user?.userId}</span>) không?
                {lockConfirm.user?.isActive !== false && " Tài khoản bị khóa sẽ không thể đăng nhập vào hệ thống."}
              </p>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setLockConfirm({ show: false, user: null })}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-DEFAULT bg-surface rounded-md border border-border transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmLock}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-sm p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-DEFAULT">
                Xác Nhận Xóa Tài Khoản
              </h3>
              <p className="text-sm text-muted mt-2">
                Bạn có chắc chắn muốn xóa tài khoản của người dùng{" "}
                <span className="font-bold text-DEFAULT">{deleteConfirm.fullName}</span> (MS: <span className="font-mono font-bold text-DEFAULT">{deleteConfirm.userId}</span>) không? Hành động này sẽ gỡ bỏ quyền truy cập vĩnh viễn và không thể khôi phục.
              </p>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    show: false,
                    id: null,
                    fullName: "",
                    userId: "",
                  })
                }
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-DEFAULT bg-surface rounded-md border border-border transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
