import React, { useState, useEffect } from "react";
import { AlertTriangle, Save } from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
const InstructorGradeEntry = () => {
  const { classId } = useParams();

  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Fetch class enrollments
  const fetchClassStudents = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/grades/class/${classId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Map Mongoose documents to edit states
      const mapped = (response.data || []).map((e) => ({
        _id: e._id,
        studentId: e.student?.userId || "-",
        fullName: e.student?.fullName || "-",
        attendanceScore:
          e.attendanceScore !== null ? String(e.attendanceScore) : "",
        midtermScore: e.midtermScore !== null ? String(e.midtermScore) : "",
        finalScore: e.finalScore !== null ? String(e.finalScore) : "",
        errors: {
          attendanceScore: false,
          midtermScore: false,
          finalScore: false,
        },
      }));
      setStudents(mapped);
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Không thể tải danh sách học viên của lớp!",
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
    fetchClassStudents();
  }, [token, classId]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 5000);
  };

  // Handle score inputs with immediate range validation (Exception 4.1)
  const handleScoreChange = (id, field, value) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s._id === id) {
          // Check if value is valid number in [0, 10] range
          const valNum = Number(value);

          const isInvalid =
            value !== "" && (isNaN(valNum) || valNum < 0 || valNum > 10);

          return {
            ...s,
            [field]: value,
            errors: { ...s.errors, [field]: isInvalid },
          };
        }
        return s;
      }),
    );
  };

  // Check if any error flags are active
  const hasValidationError = students.some(
    (s) =>
      s.errors.attendanceScore || s.errors.midtermScore || s.errors.finalScore,
  );

  // Save grades bulk payload
  const handleSaveGrades = async () => {
    if (hasValidationError) return;
    setSaving(true);

    try {
      const payload = students.map((s) => ({
        enrollmentId: s._id,
        attendanceScore:
          s.attendanceScore === "" ? null : Number(s.attendanceScore),
        midtermScore: s.midtermScore === "" ? null : Number(s.midtermScore),
        finalScore: s.finalScore === "" ? null : Number(s.finalScore),
      }));

      await axios.put(
        `http://localhost:5000/api/grades/class/${classId}/bulk-update`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showToast("Cập nhật điểm thành công!", "success");
      fetchClassStudents();

      // Refresh calculations
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Gặp lỗi trong quá trình cập nhật bảng điểm!",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col">
      {" "}
      {/* Toast Notifications */}{" "}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center px-4 py-3 rounded-lg shadow-2xl transition-all duration-300 transform translate-y-0 ${toast.type === "success" ? "bg-backgroundmerald-600 text-white" : "bg-rose-600 text-white"}`}
        >
          <span className="mr-2 font-bold">
            {toast.type === "success" ? "✓" : "⚠"}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}{" "}
      {/* Header bar */} {/* Dashboard Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            {" "}
            Nhập Điểm Lớp Học Phần
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {" "}
            Lớp học phần:
            <span className="font-mono font-bold text-amber-400">
              {classId}
            </span>
            . Cập nhật điểm thành phần hệ 10 và xem phân loại điểm chữ tự động.
          </p>
        </div>{" "}
        {/* Validation Warnings (Exception 4.1) */}{" "}
        {hasValidationError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-sm text-rose-400 font-semibold animate-pulse">
            {" "}
            <AlertTriangle className="w-4 h-4 inline-block mr-1" /> Điểm số
            không hợp lệ. Vui lòng nhập số từ 0 đến 10.
          </div>
        )}{" "}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400 font-medium">
              Đang tải danh sách sinh viên...
            </span>
          </div>
        ) : (
          <div className="bg-slate-850 border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-surface/40">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Danh sách lớp HP ({students.length} sinh viên)
              </span>
              <button
                onClick={handleSaveGrades}
                disabled={hasValidationError || saving}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-md transition duration-150 ${hasValidationError || saving ? "bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-650" : "bg-amber-400 hover:bg-amber-350 text-slate-900"}`}
              >
                {" "}
                {saving
                  ? "Đang lưu..."
                  : '<Save className="w-4 h-4 inline-block mr-1" /> Lưu bảng điểm'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-border text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Mã sinh viên</th>
                    <th className="px-6 py-4">Họ và tên</th>
                    <th className="px-6 py-4 text-center">Chuyên cần (10%)</th>
                    <th className="px-6 py-4 text-center">Giữa kỳ (20%)</th>
                    <th className="px-6 py-4 text-center">Cuối kỳ (70%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {" "}
                  {students.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-700/10 transition duration-150"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-300">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 font-semibold text-DEFAULT">
                        {student.fullName}
                      </td>{" "}
                      {/* Attendance score column input */}
                      <td className="px-6 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={student.attendanceScore}
                          onChange={(e) =>
                            handleScoreChange(
                              student._id,
                              "attendanceScore",
                              e.target.value,
                            )
                          }
                          className={`w-24 px-3 py-1.5 text-center bg-background border rounded-lg text-DEFAULT font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition ${student.errors.attendanceScore ? "border-red-500 ring-2 ring-red-500/25" : "border-border"}`}
                          placeholder="-"
                        />
                      </td>{" "}
                      {/* Midterm score column input */}
                      <td className="px-6 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={student.midtermScore}
                          onChange={(e) =>
                            handleScoreChange(
                              student._id,
                              "midtermScore",
                              e.target.value,
                            )
                          }
                          className={`w-24 px-3 py-1.5 text-center bg-background border rounded-lg text-DEFAULT font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition ${student.errors.midtermScore ? "border-red-500 ring-2 ring-red-500/25" : "border-border"}`}
                          placeholder="-"
                        />
                      </td>{" "}
                      {/* Final score column input */}
                      <td className="px-6 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={student.finalScore}
                          onChange={(e) =>
                            handleScoreChange(
                              student._id,
                              "finalScore",
                              e.target.value,
                            )
                          }
                          className={`w-24 px-3 py-1.5 text-center bg-background border rounded-lg text-DEFAULT font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition ${student.errors.finalScore ? "border-red-500 ring-2 ring-red-500/25" : "border-border"}`}
                          placeholder="-"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorGradeEntry;
