import { useState, useEffect, useRef } from "react";
import { Calendar, Plus, CheckCircle, AlertTriangle, X, Settings, MoreHorizontal, Edit3, BookOpen } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const SemesterManagement = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // Initial States
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Alert toast state (Hoisted to top)
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

  // Refs for input elements to support validation focus
  const semesterIdRef = useRef(null);
  const semesterNameRef = useRef(null);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const regStartDateRef = useRef(null);
  const regEndDateRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    semesterId: "",
    semesterName: "",
    startDate: "",
    endDate: "",
    registrationStartDate: "",
    registrationEndDate: "",
    isActive: false,
  });

  // Fetch semesters
  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/semesters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSemesters(response.data || []);
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể tải danh sách học kỳ!",
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
    fetchSemesters();
  }, [token]);

  // Helper functions to format dates for inputs
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const formatDateTimeForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // Open Modal for Create
  const handleCreateOpen = () => {
    setEditingSemester(null);
    setForm({
      semesterId: "",
      semesterName: "",
      startDate: "",
      endDate: "",
      registrationStartDate: "",
      registrationEndDate: "",
      isActive: false,
    });
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleEditOpen = (sem) => {
    setEditingSemester(sem);
    setForm({
      semesterId: sem.semesterId || "",
      semesterName: sem.semesterName || "",
      startDate: formatDateForInput(sem.startDate),
      endDate: formatDateForInput(sem.endDate),
      registrationStartDate: formatDateTimeForInput(sem.registrationStartDate),
      registrationEndDate: formatDateTimeForInput(sem.registrationEndDate),
      isActive: sem.isActive || false,
    });
    setModalOpen(true);
  };

  // Validate form inputs
  const validateForm = () => {
    if (!form.semesterId) {
      semesterIdRef.current?.focus();
      return false;
    }
    if (!form.semesterName) {
      semesterNameRef.current?.focus();
      return false;
    }
    if (!form.startDate) {
      startDateRef.current?.focus();
      return false;
    }
    if (!form.endDate) {
      endDateRef.current?.focus();
      return false;
    }
    if (!form.registrationStartDate) {
      regStartDateRef.current?.focus();
      return false;
    }
    if (!form.registrationEndDate) {
      regEndDateRef.current?.focus();
      return false;
    }
    
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const regStart = new Date(form.registrationStartDate);
    const regEnd = new Date(form.registrationEndDate);

    if (end <= start) {
      endDateRef.current?.focus();
      return false;
    }
    if (regEnd <= regStart) {
      regEndDateRef.current?.focus();
      return false;
    }
    return true;
  };

  // Handle Submit Create/Update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showAlert(
        "Logic thời gian không hợp lệ hoặc thiếu thông tin. Vui lòng kiểm tra lại!",
        "error",
      );
      return;
    }
    try {
      if (editingSemester) {
        await axios.put(
          `http://localhost:5000/api/semesters/${editingSemester._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        await axios.post("http://localhost:5000/api/semesters", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      showAlert("Cập nhật học kỳ thành công!", "success");
      setModalOpen(false);
      fetchSemesters();
    } catch (err) {
      showAlert(err.response?.data?.message || "Có lỗi xảy ra!", "error");
    }
  };

  const displayDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const displayDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  return (
    <div className="bg-background min-h-screen text-DEFAULT flex flex-col w-full transition-colors duration-150">
      
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

      {/* Main content area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
              Quản Lý Học Kỳ Tuyển Sinh
            </h1>
            <p className="text-muted mt-1 text-sm">
              Định cấu hình các đợt học kỳ đào tạo và thời gian hoạt động của cổng đăng ký tín chỉ
            </p>
          </div>
          <button
            onClick={handleCreateOpen}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition duration-200 cursor-pointer flex items-center gap-1.5 border-none"
          >
            <Plus size={16} />
            Thiết lập học kỳ mới
          </button>
        </div>

        {/* Table list view */}
        <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted font-medium animate-pulse">
                Đang tải danh sách học kỳ...
              </span>
            </div>
          ) : semesters.length === 0 ? (
            <div className="p-20 text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-450">
                Chưa thiết lập học kỳ nào
              </h3>
              <p className="text-muted mt-1 text-sm max-w-md mx-auto">
                Vui lòng nhấp vào nút ở trên để tạo một học kỳ mới và kích hoạt cổng thông tin đào tạo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[290px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Mã Học Kỳ</th>
                    <th className="px-6 py-4">Tên Học Kỳ</th>
                    <th className="px-6 py-4">Thời Gian Học Kỳ</th>
                    <th className="px-6 py-4">Cổng Đăng Ký Tín Chỉ</th>
                    <th className="px-6 py-4 text-center">Trạng Thái Hoạt Động</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {semesters.map((sem) => (
                    <tr
                      key={sem._id}
                      className="hover:bg-background/80 transition duration-150"
                    >
                      <td className="py-3 px-4 align-middle font-mono text-DEFAULT font-semibold">
                        {sem.semesterId}
                      </td>
                      <td className="py-3 px-4 align-middle text-DEFAULT font-semibold">
                        {sem.semesterName}
                      </td>
                      <td className="py-3 px-4 align-middle text-muted">
                        Từ: <span className="text-DEFAULT font-medium">{displayDate(sem.startDate)}</span>
                        <br />
                        Đến: <span className="text-DEFAULT font-medium">{displayDate(sem.endDate)}</span>
                      </td>
                      <td className="py-3 px-4 align-middle text-muted">
                        Mở: <span className="text-DEFAULT font-medium text-xs">{displayDateTime(sem.registrationStartDate)}</span>
                        <br />
                        Đóng: <span className="text-DEFAULT font-medium text-xs">{displayDateTime(sem.registrationEndDate)}</span>
                      </td>
                      <td className="py-3 px-4 align-middle text-center">
                        {sem.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle size={10} className="mr-1" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-transparent border border-border text-muted">
                            Chờ / Đóng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === sem._id ? null : sem._id)}
                            className="p-2 rounded-md text-muted hover:text-DEFAULT hover:bg-background transition-colors focus:outline-none cursor-pointer bg-transparent border-none"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {openDropdownId === sem._id && (
                            <>
                              {/* Click outside backdrop */}
                              <div
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div className="absolute right-0 w-56 bg-surface border border-border rounded-md shadow-xl z-50 overflow-hidden text-left animate-in fade-in duration-150 top-full mt-1 origin-top">
                                <button
                                  onClick={() => {
                                    navigate('/admin/classes?semesterId=' + sem.semesterId);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-muted hover:text-DEFAULT hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  Lớp học phần mở trong kỳ
                                </button>
                                <button
                                  onClick={() => {
                                    handleEditOpen(sem);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-muted hover:text-DEFAULT hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  Sửa cấu hình
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
      </div>

      {/* Modal Dialog Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-lg shadow-sm overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-background/50 px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-extrabold text-DEFAULT flex items-center gap-1.5">
                {editingSemester ? <Settings size={16} /> : <Plus size={16} />}
                {editingSemester ? "Cập Nhật Học Kỳ" : "Thiết Lập Học Kỳ Mới"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-DEFAULT transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Mã Học Kỳ (ID)
                  </label>
                  <input
                    ref={semesterIdRef}
                    type="text"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    placeholder="e.g. HK1-2026-2027"
                    value={form.semesterId}
                    onChange={(e) =>
                      setForm({ ...form, semesterId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Tên Học Kỳ
                  </label>
                  <input
                    ref={semesterNameRef}
                    type="text"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Học kỳ 1 Năm học 2026-2027"
                    value={form.semesterName}
                    onChange={(e) =>
                      setForm({ ...form, semesterName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Ngày Bắt Đầu Học Kỳ
                  </label>
                  <input
                    ref={startDateRef}
                    type="date"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Ngày Kết Thúc Học Kỳ
                  </label>
                  <input
                    ref={endDateRef}
                    type="date"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Mở Cổng Đăng Ký
                  </label>
                  <input
                    ref={regStartDateRef}
                    type="datetime-local"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                    value={form.registrationStartDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        registrationStartDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Đóng Cổng Đăng Ký
                  </label>
                  <input
                    ref={regEndDateRef}
                    type="datetime-local"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                    value={form.registrationEndDate}
                    onChange={(e) =>
                      setForm({ ...form, registrationEndDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-border">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-DEFAULT">
                    Đặt làm học kỳ hiện tại
                  </span>
                  <span className="text-[10px] text-muted block mt-0.5">
                    Đặt làm học kỳ Đang hoạt động duy nhất trên toàn hệ thống
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-focus:ring-1 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-background text-muted hover:text-DEFAULT rounded-md text-xs font-semibold transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-xs font-semibold transition cursor-pointer border-none"
                >
                  {editingSemester ? "Lưu cập nhật" : "Thiết lập ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterManagement;
