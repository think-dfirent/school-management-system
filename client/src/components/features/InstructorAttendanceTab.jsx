import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Save, CheckCircle } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const ptitDayToJsDay = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 0 };

const generateSessions = (credits, startDateStr, dayOfWeek) => {
  const sessions = [];
  if (!startDateStr || !credits || !dayOfWeek) return sessions;
  const numSessions = credits * 3;
  const start = new Date(startDateStr);
  const targetJsDay = ptitDayToJsDay[dayOfWeek];
  const firstSessionDate = new Date(start);

  while (firstSessionDate.getDay() !== targetJsDay) {
    firstSessionDate.setDate(firstSessionDate.getDate() + 1);
  }
  for (let i = 1; i <= numSessions; i++) {
    const expectedDate = new Date(firstSessionDate);
    expectedDate.setDate(firstSessionDate.getDate() + (i - 1) * 7);
    const yyyy = expectedDate.getFullYear();
    const mm = String(expectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(expectedDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    sessions.push({ sessionNumber: i, expectedDate: dateStr });
  }
  return sessions;
};

const formatSessionLabel = (sessionNum, dateStr) => {
  const [yyyy, mm, dd] = dateStr.split("-");
  return `Buổi ${sessionNum} - ${dd}/${mm}/${yyyy}`;
};

const InstructorAttendanceTab = ({ classId, classObj }) => {
  const token = useAuthStore((state) => state.token);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [initialRecords, setInitialRecords] = useState({});
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Sessions parsing
  const credits = classObj?.subject?.credits || 3;
  const startDate = classObj?.startDate;
  const dayOfWeek = classObj?.schedules?.[0]?.dayOfWeek || 2;
  const sessions = generateSessions(credits, startDate, dayOfWeek);
  const [selectedSession, setSelectedSession] = useState(1);

  // Derived Date of the current session
  const currentSessionObj = sessions.find((s) => s.sessionNumber === selectedSession);
  const sessionDate = currentSessionObj?.expectedDate || "";

  // Confirmation popup modal state
  const [showConfirm, setShowConfirm] = useState(false);

  // Toast alerts state
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Validate if the selected actual date is in the future
  const isFutureDate = () => {
    if (!sessionDate) return false;
    const selected = new Date(sessionDate);
    const today = new Date();
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return selected > today;
  };

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "success" });
    }, 5000);
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/attendance?classId=${classId}&sessionNumber=${selectedSession}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const studentList = res.data.students || [];
      const existingAttendance = res.data.attendance;
      setStudents(studentList);

      // Map records
      const mappedRecords = {};
      if (existingAttendance && existingAttendance.records) {
        existingAttendance.records.forEach((rec) => {
          mappedRecords[rec.student._id || rec.student] = rec.status;
        });
        setHasExisting(true);
      } else {
        studentList.forEach((st) => {
          mappedRecords[st._id] = "present";
        });
        setHasExisting(false);
      }
      setRecords(mappedRecords);
      setInitialRecords(mappedRecords);
    } catch {
      showAlert("Lỗi khi lấy dữ liệu điểm danh!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId && token && selectedSession) {
      fetchAttendanceData();
    }
  }, [classId, selectedSession, token]);

  const handleStatusChange = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (isFutureDate()) {
      showAlert("Không thể điểm danh cho buổi học chưa diễn ra!", "error");
      return;
    }
    if (hasExisting) {
      setShowConfirm(true);
    } else {
      submitAttendance();
    }
  };

  const submitAttendance = async () => {
    setSubmitting(true);
    try {
      const formattedRecords = Object.keys(records).map((stId) => ({
        student: stId,
        status: records[stId],
      }));

      await axios.post(
        "http://localhost:5000/api/attendance",
        {
          classId,
          sessionNumber: selectedSession,
          actualDate: sessionDate,
          records: formattedRecords,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert("Ghi nhận điểm danh thành công!", "success");
      setHasExisting(true);
      setShowConfirm(false);
      fetchAttendanceData();
    } catch {
      showAlert("Lỗi lưu dữ liệu điểm danh!", "error");
    } finally {
      setSubmitting(false);
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

      {/* Upper Date selector and control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background border border-border p-4 rounded-md shadow-sm">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Chọn buổi điểm danh:
            </label>
            <select
              className="bg-surface border border-border rounded px-3 py-1.5 text-xs text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer font-bold transition"
              value={selectedSession}
              onChange={(e) => setSelectedSession(parseInt(e.target.value))}
            >
              {sessions.map((s) => (
                <option key={s.sessionNumber} value={s.sessionNumber}>
                  {formatSessionLabel(s.sessionNumber, s.expectedDate)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSaveClick}
          disabled={submitting || isFutureDate() || students.length === 0}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-md shadow-sm disabled:opacity-40 transition cursor-pointer border-none flex items-center justify-center gap-1.5"
        >
          {submitting ? (
            "Đang lưu..."
          ) : (
            <>
              <Save size={14} />
              Lưu điểm danh
            </>
          )}
        </button>
      </div>

      {isFutureDate() && (
        <div className="bg-rose-500/10 border border-primary/25 rounded-md p-6 text-center text-primary font-bold animate-pulse text-sm flex items-center justify-center gap-1.5">
          <AlertTriangle size={16} />
          Không thể điểm danh hoặc ghi nhận chuyên cần cho buổi học trong tương lai!
        </div>
      )}

      {!isFutureDate() &&
        (loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface border border-border rounded-md shadow-sm">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted text-xs font-medium animate-pulse">
              Đang tải danh sách điểm danh...
            </span>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-surface border border-border rounded-md p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-400">
              Không có học viên đăng ký lớp này
            </h4>
            <p className="text-xs text-muted mt-1">
              Bảng điểm danh trống do chưa có sinh viên đăng ký học phần.
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
                    <th className="px-6 py-4 text-center">Trạng thái điểm danh</th>
                    <th className="px-6 py-4 text-center">Điểm chuyên cần hệ 10</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-medium">
                  {students.map((st) => {
                    const isChanged = records[st._id] !== initialRecords[st._id];
                    return (
                      <tr
                        key={st._id}
                        className={`transition duration-150 border-b border-border ${
                          isChanged
                            ? "bg-primary/5 border-l-4 border-primary"
                            : "hover:bg-background/80"
                        }`}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-DEFAULT">
                          {st.userId}
                        </td>
                        <td className="px-6 py-4 text-DEFAULT font-semibold">
                          {st.fullName}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="inline-flex rounded-md border border-border p-0.5 bg-background/50">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st._id, "present")}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer border-none ${
                                records[st._id] === "present"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "text-muted hover:text-DEFAULT"
                              }`}
                            >
                              Đi học
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st._id, "absent")}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer border-none ${
                                records[st._id] === "absent"
                                  ? "bg-primary text-white shadow-sm"
                                  : "text-muted hover:text-DEFAULT"
                              }`}
                            >
                              Vắng mặt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st._id, "excused")}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer border-none ${
                                records[st._id] === "excused"
                                  ? "bg-amber-500 text-slate-950 shadow-sm"
                                  : "text-muted hover:text-DEFAULT"
                              }`}
                            >
                              Có phép
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-DEFAULT">
                          {st.attendanceScore !== null && st.attendanceScore !== undefined
                            ? Number(st.attendanceScore).toFixed(1)
                            : "10.0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {/* Overwrite Confirmation Dialog Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-sm shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-DEFAULT">
              Cập nhật dữ liệu điểm danh?
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Buổi học này đã được điểm danh trước đó. Bạn có chắc chắn muốn cập nhật lại bảng điểm danh này không? Dữ liệu cũ sẽ bị ghi đè.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-muted bg-transparent border border-border hover:bg-background rounded-md transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={submitAttendance}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer border-none"
              >
                {submitting ? "Đang cập nhật..." : "Xác nhận cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorAttendanceTab;