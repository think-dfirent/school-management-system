import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  AlertTriangle, 
  Search, 
  Edit3, 
  CheckCircle,
  X,
  Loader2
} from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const AdminGradeManagement = () => {
  const token = useAuthStore((state) => state.token);

  // Filter states
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal States
  const [editModal, setEditModal] = useState({ show: false, enrollment: null });
  const [modalForm, setModalForm] = useState({
    attendance: "",
    midterm: "",
    final: "",
  });
  const [modalError, setModalError] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  // Toast alert state
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

  // Load filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [semRes, classRes] = await Promise.all([
          axios.get("http://localhost:5000/api/semesters", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/classes", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setSemesters(semRes.data || []);
        setClasses(classRes.data || []);
      } catch (err) {
        setError("Không thể nạp danh mục học kỳ và lớp học!");
      }
    };

    if (token) {
      fetchFilters();
    }
  }, [token]);

  // Fetch grades list based on filters
  const fetchGrades = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/grades",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            semesterId: selectedSemester,
            classId: selectedClass,
            search: studentSearch,
          },
        }
      );
      setGrades(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tải bảng điểm học tập!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGrades();
    }
  }, [token, selectedSemester, selectedClass]);

  // Triggers search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGrades();
  };

  // Open Edit Modal
  const handleOpenEdit = (enrollment) => {
    setEditModal({ show: true, enrollment });
    setModalForm({
      attendance:
        enrollment.attendanceScore !== null ? enrollment.attendanceScore : "",
      midterm: enrollment.midtermScore !== null ? enrollment.midtermScore : "",
      final: enrollment.finalScore !== null ? enrollment.finalScore : "",
    });
    setModalError("");
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditModal({ show: false, enrollment: null });
  };

  // Submit Edit Grades
  const handleSaveGrades = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSaving(true);

    const { attendance, midterm, final } = modalForm;
    // Validation helper
    const parseGrade = (val) => {
      if (val === "") return null;
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed < 0 || parsed > 10) return -1;
      return parsed;
    };

    const att = parseGrade(attendance);
    const mid = parseGrade(midterm);
    const fin = parseGrade(final);

    if (att === -1 || mid === -1 || fin === -1) {
      setModalError("Điểm nhập vào phải là số từ 0.0 đến 10.0!");
      setModalSaving(false);
      return;
    }
    try {
      const res = await axios.put(
        `http://localhost:5000/api/admin/grades/${editModal.enrollment._id}`,
        { attendanceScore: att, midtermScore: mid, finalScore: fin },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state list directly to prevent complete page re-loading
      const updated = res.data.enrollment;
      setGrades(
        grades.map((g) => (g._id === updated._id ? { ...g, ...updated } : g))
      );
      showToast("Cập nhật điểm học viên thành công!", "success");
      handleCloseEdit();
    } catch (err) {
      setModalError(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu điểm!"
      );
    } finally {
      setModalSaving(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 text-DEFAULT">
      {/* Custom Toast Alert */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center px-4 py-3 rounded-md shadow-lg transition-all duration-300 transform translate-y-0 border ${
            toast.type === "success"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-primary/10 text-primary border-primary/20"
          }`}
        >
          <span className="mr-2">
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-DEFAULT">
          Quản Lý Điểm Số
        </h1>
        <p className="text-muted mt-1 text-sm">
          Tra cứu, nhập liệu và điều chỉnh điểm số học phần của sinh viên toàn trường
        </p>
      </div>

      {/* Filter controls panel */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          {/* Semester selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">
              Học Kỳ
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-background border border-border text-DEFAULT rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
            >
              <option value="all">Tất cả học kỳ</option>
              {semesters.map((sem) => (
                <option key={sem._id} value={sem._id}>
                  {sem.semesterName}
                </option>
              ))}
            </select>
          </div>

          {/* Class selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">
              Lớp Học Phần
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-background border border-border text-DEFAULT rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.classId} ({cls.subject?.subjectName})
                </option>
              ))}
            </select>
          </div>

          {/* Search string */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">
              Mã Sinh Viên / Họ Tên
            </label>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Nhập mã sinh viên..."
              className="w-full bg-background border border-border text-DEFAULT rounded-md px-3 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Search trigger button */}
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Tìm Kiếm
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-md bg-primary/10 border border-primary/20 text-sm text-primary font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* Results Table Panel */}
      <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden animate-fade-in">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3">
            <Loader2 className="w-8 h-8 text-muted animate-spin" />
            <span className="text-muted font-medium animate-pulse text-sm">
              Đang tải bảng điểm học viên...
            </span>
          </div>
        ) : grades.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="p-4 bg-background rounded-full mb-4 border border-border">
              <BarChart3 className="w-10 h-10 text-muted" />
            </div>
            <h3 className="text-lg font-bold text-DEFAULT">
              Không có kết quả điểm số nào
            </h3>
            <p className="text-muted mt-1 text-sm max-w-md mx-auto">
              Không tìm thấy học viên nào khớp với tiêu chí bộ lọc. Vui lòng kiểm tra lại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Sinh Viên</th>
                  <th className="px-6 py-4">Học Phần</th>
                  <th className="px-6 py-4 text-center">Chuyên Cần</th>
                  <th className="px-6 py-4 text-center">Giữa Kỳ</th>
                  <th className="px-6 py-4 text-center">Cuối Kỳ</th>
                  <th className="px-6 py-4 text-center">Tổng Kết</th>
                  <th className="px-6 py-4 text-center">Điểm Chữ</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                  <th className="px-6 py-4 text-center w-28">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {grades.map((g) => {
                  const studentName = g.student?.fullName || "-";
                  const studentId = g.student?.userId || "-";
                  const className = g.class?.classId || "-";
                  const subjectName = g.class?.subject?.subjectName || "-";
                  
                  const att = g.attendanceScore !== null ? g.attendanceScore : "-";
                  const mid = g.midtermScore !== null ? g.midtermScore : "-";
                  const fin = g.finalScore !== null ? g.finalScore : "-";
                  const tot = g.totalScore !== null ? g.totalScore : "-";
                  const letter = g.letterGrade || "-";
                  
                  return (
                    <tr
                      key={g._id}
                      className="hover:bg-background/80 transition duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-DEFAULT">
                          {studentName}
                        </div>
                        <div className="text-xs text-muted font-mono">
                          {studentId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-DEFAULT">
                          {subjectName}
                        </div>
                        <div className="text-xs text-muted font-mono">
                          {className}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-muted">
                        {att}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-muted">
                        {mid}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-muted">
                        {fin}
                      </td>
                      <td
                        className={`px-6 py-4 text-center font-mono font-bold ${
                          tot !== "-" && parseFloat(tot) >= 4.0
                            ? "text-emerald-500"
                            : tot !== "-"
                            ? "text-primary"
                            : "text-muted"
                        }`}
                      >
                        {tot}
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span
                          className={`px-2 py-1 rounded-md text-xs border ${
                            letter === "A" || letter === "A+"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : letter.startsWith("B")
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : letter.startsWith("C")
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : letter.startsWith("D")
                              ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                              : letter === "F"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-background text-muted border-border"
                          }`}
                        >
                          {letter}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            g.status === "Đạt"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : g.status === "Không đạt"
                              ? "bg-primary/10 text-primary"
                              : "bg-background text-muted"
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="px-3 py-1.5 bg-transparent hover:bg-background border border-border text-muted hover:text-DEFAULT rounded-md text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 w-full"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Sửa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal Popup */}
      {editModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-md shadow-xl w-full max-w-md animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-DEFAULT">
                  Cập Nhật Điểm Sinh Viên
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {editModal.enrollment?.student?.fullName} (
                  {editModal.enrollment?.student?.userId})
                </p>
              </div>
              <button
                onClick={handleCloseEdit}
                className="text-muted hover:text-DEFAULT transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveGrades} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 mb-2 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {modalError}
                </div>
              )}
              
              {/* Attendance Grade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Điểm Chuyên Cần (Hệ 10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={modalForm.attendance}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, attendance: e.target.value })
                  }
                  placeholder="Ví dụ: 8.5 (Bỏ trống nếu chưa có)"
                  className="w-full bg-background border border-border text-DEFAULT rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {/* Midterm Grade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Điểm Giữa Kỳ (Hệ 10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={modalForm.midterm}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, midterm: e.target.value })
                  }
                  placeholder="Ví dụ: 7.0 (Bỏ trống nếu chưa có)"
                  className="w-full bg-background border border-border text-DEFAULT rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {/* Final Grade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Điểm Cuối Kỳ (Hệ 10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={modalForm.final}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, final: e.target.value })
                  }
                  placeholder="Ví dụ: 9.0 (Bỏ trống nếu chưa có)"
                  className="w-full bg-background border border-border text-DEFAULT rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 border border-border hover:bg-background text-muted hover:text-DEFAULT rounded-md text-sm font-medium transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {modalSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    "Lưu Thay Đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGradeManagement;