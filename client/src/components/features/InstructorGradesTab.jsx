import { useState, useEffect } from "react";
import { BookOpen, AlertTriangle, Save, CheckCircle } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const InstructorGradesTab = ({ classId }) => {
  const token = useAuthStore((state) => state.token);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Alert toast state
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/grades/class/${classId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Synchronize data fields
      const mappedGrades = (res.data || []).map((enroll) => {
        const attVal =
          enroll.grades?.attendance !== null && enroll.grades?.attendance !== undefined
            ? enroll.grades.attendance
            : enroll.attendanceScore !== null
              ? enroll.attendanceScore
              : "";

        const midVal =
          enroll.grades?.midterm !== null && enroll.grades?.midterm !== undefined
            ? enroll.grades.midterm
            : enroll.midtermScore !== null
              ? enroll.midtermScore
              : "";

        const finVal =
          enroll.grades?.final !== null && enroll.grades?.final !== undefined
            ? enroll.grades.final
            : enroll.finalScore !== null
              ? enroll.finalScore
              : "";

        const totalVal =
          enroll.grades?.total !== null && enroll.grades?.total !== undefined
            ? enroll.grades.total
            : enroll.totalScore !== null
              ? enroll.totalScore
              : "";

        const letterGradeVal = enroll.grades?.letterGrade || enroll.letterGrade || "-";
        return {
          enrollmentId: enroll._id,
          studentId: enroll.student?.userId || "",
          fullName: enroll.student?.fullName || "",
          attendance: attVal,
          midterm: midVal,
          final: finVal,
          total: totalVal,
          letterGrade: letterGradeVal,
        };
      });
      setGrades(mappedGrades);
    } catch {
      showAlert("Lỗi khi tải bảng điểm lớp học!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId && token) {
      fetchGrades();
    }
  }, [classId, token]);

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "success" });
    }, 5000);
  };

  const handleInputChange = (enrollmentId, field, value) => {
    setGrades((prev) =>
      prev.map((item) => {
        if (item.enrollmentId === enrollmentId) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const isValidInput = (val) => {
    if (val === "" || val === null || val === undefined) return true;
    const num = Number(val);
    return !isNaN(num) && num >= 0 && num <= 10;
  };

  const hasAnyErrors = grades.some(
    (item) =>
      !isValidInput(item.attendance) ||
      !isValidInput(item.midterm) ||
      !isValidInput(item.final),
  );

  const handleSave = async () => {
    if (hasAnyErrors) {
      showAlert("Điểm số không hợp lệ. Vui lòng nhập số từ 0 đến 10.", "error");
      return;
    }
    setSaving(true);

    try {
      const studentGradesPayload = grades.map((item) => ({
        enrollmentId: item.enrollmentId,
        attendance: item.attendance === "" ? null : Number(item.attendance),
        midterm: item.midterm === "" ? null : Number(item.midterm),
        final: item.final === "" ? null : Number(item.final),
      }));

      await axios.put(
        "http://localhost:5000/api/grades/class/update",
        { classId, studentGrades: studentGradesPayload },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert("Cập nhật điểm thành công!", "success");
      fetchGrades();
    } catch {
      showAlert("Có lỗi xảy ra khi lưu bảng điểm!", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-DEFAULT">
            Nhập &amp; Điều chỉnh Điểm Số Thành Phần
          </h3>
          <p className="text-xs text-muted mt-0.5 font-medium">
            Nhập điểm hệ 10: Chuyên cần (10%), Giữa kỳ (20%), Cuối kỳ (70%)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {hasAnyErrors && (
            <span className="text-xs font-bold text-primary animate-pulse flex items-center gap-1">
              <AlertTriangle size={12} />
              Điểm số không hợp lệ. Vui lòng nhập số từ 0 đến 10.
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={hasAnyErrors || saving}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-md shadow-sm disabled:opacity-40 disabled:hover:bg-primary transition cursor-pointer border-none flex items-center justify-center gap-1.5"
          >
            {saving ? (
              "Đang lưu điểm..."
            ) : (
              <>
                <Save size={14} />
                Lưu bảng điểm
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface border border-border rounded-md shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted text-xs font-medium animate-pulse">
            Đang tải bảng điểm...
          </span>
        </div>
      ) : grades.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-404 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-400">
            Không có sinh viên đăng ký lớp này
          </h4>
          <p className="text-xs text-muted mt-1">
            Bảng điểm hiện đang trống do chưa có sinh viên đăng ký học.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Mã sinh viên</th>
                  <th className="px-6 py-4">Họ và tên</th>
                  <th className="px-6 py-4 text-center">Chuyên cần (10%)</th>
                  <th className="px-6 py-4 text-center">Giữa kỳ (20%)</th>
                  <th className="px-6 py-4 text-center">Cuối kỳ (70%)</th>
                  <th className="px-6 py-4 text-center">Điểm tổng kết</th>
                  <th className="px-6 py-4 text-center">Điểm chữ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium">
                {grades.map((item) => (
                  <tr
                    key={item.enrollmentId}
                    className="hover:bg-background/80 transition duration-150 border-b border-border"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-DEFAULT">
                      {item.studentId}
                    </td>
                    <td className="px-6 py-4 text-DEFAULT font-semibold">{item.fullName}</td>
                    
                    {/* Attendance score */}
                    <td className="px-6 py-3 text-center">
                      <input
                        type="text"
                        className={`w-20 bg-background border rounded px-2.5 py-1 text-center font-mono text-xs focus:outline-none transition ${
                          !isValidInput(item.attendance)
                            ? "border-primary text-primary"
                            : "border-border focus:border-primary text-DEFAULT focus:ring-1 focus:ring-primary"
                        }`}
                        value={item.attendance}
                        placeholder="-"
                        onChange={(e) =>
                          handleInputChange(
                            item.enrollmentId,
                            "attendance",
                            e.target.value,
                          )
                        }
                      />
                    </td>

                    {/* Midterm score */}
                    <td className="px-6 py-3 text-center">
                      <input
                        type="text"
                        className={`w-20 bg-background border rounded px-2.5 py-1 text-center font-mono text-xs focus:outline-none transition ${
                          !isValidInput(item.midterm)
                            ? "border-primary text-primary"
                            : "border-border focus:border-primary text-DEFAULT focus:ring-1 focus:ring-primary"
                        }`}
                        value={item.midterm}
                        placeholder="-"
                        onChange={(e) =>
                          handleInputChange(
                            item.enrollmentId,
                            "midterm",
                            e.target.value,
                          )
                        }
                      />
                    </td>

                    {/* Final score */}
                    <td className="px-6 py-3 text-center">
                      <input
                        type="text"
                        className={`w-20 bg-background border rounded px-2.5 py-1 text-center font-mono text-xs focus:outline-none transition ${
                          !isValidInput(item.final)
                            ? "border-primary text-primary"
                            : "border-border focus:border-primary text-DEFAULT focus:ring-1 focus:ring-primary"
                        }`}
                        value={item.final}
                        placeholder="-"
                        onChange={(e) =>
                          handleInputChange(
                            item.enrollmentId,
                            "final",
                            e.target.value,
                          )
                        }
                      />
                    </td>

                    {/* Total Score display */}
                    <td className="px-6 py-4 text-center font-mono font-bold text-DEFAULT">
                      {item.total !== "" && item.total !== null
                        ? Number(item.total).toFixed(1)
                        : "-"}
                    </td>

                    {/* Letter Grade display */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.letterGrade === "F"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : item.letterGrade === "A"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}
                      >
                        {item.letterGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorGradesTab;
