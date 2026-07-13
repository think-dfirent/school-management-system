import React, { useState, useEffect } from "react";
import { Users, Calendar, AlertTriangle } from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
const ClassAttendance = () => {
  const { classId } = useParams();

  // Class ObjectId from route param
  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);

  const currentUser = useAuthStore((state) => state.user);

  const [students, setStudents] = useState([]);

  const [records, setRecords] = useState({});

  // { studentId: 'present' | 'absent' | 'excused' }
  const [hasExisting, setHasExisting] = useState(false);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Date picker state - defaults to today (local timezone YYYY-MM-DD)
  const getTodayString = () => {
    const d = new Date();

    const year = d.getFullYear();

    const month = String(d.getMonth() + 1).padStart(2, "0");

    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayString());

  // Confirmation popup modal state
  const [showConfirm, setShowConfirm] = useState(false);

  // Toast alerts state
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Validate if the selected date is in the future
  const isFutureDate = () => {
    const selected = new Date(date);

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
        `http://localhost:5000/api/attendance?classId=${classId}&date=${date}`,
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
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Lỗi khi lấy dữ liệu điểm danh!",
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
    if (classId && !isFutureDate()) {
      fetchAttendanceData();
    } else {
      setStudents([]);
      setRecords({});
      setLoading(false);
    }
  }, [classId, date, token]);

  const handleStatusChange = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  // Save Attendance Handler
  const handleSaveClick = (e) => {
    e.preventDefault();

    // Exception 2.1: Future Date Check
    if (isFutureDate()) {
      showAlert("Không thể điểm danh cho buổi học chưa diễn ra!", "error");
      return;
    }
    // Exception 4.1: Confirmation Dialog
    if (hasExisting) {
      setShowConfirm(true);
    } else {
      submitAttendance();
    }
  };

  const submitAttendance = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    const recordsPayload = Object.keys(records).map((studentId) => ({
      student: studentId,
      status: records[studentId],
    }));

    try {
      const res = await axios.post(
        "http://localhost:5000/api/attendance",
        { classId, date, records: recordsPayload },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert("Lưu điểm danh thành công!", "success");
      setHasExisting(true);
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu điểm danh!",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col relative">
      {" "}
      {/* Custom Toast Alert */}{" "}
      {alert.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center px-4 py-3 rounded-lg shadow-2xl transition-all duration-300 transform translate-y-0 ${alert.type === "success" ? "bg-backgroundmerald-600 text-white" : "bg-rose-600 text-white"}`}
        >
          <span className="mr-2 font-bold">
            {alert.type === "success" ? "✓" : "⚠"}
          </span>
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}{" "}
      {/* Header bar */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            {" "}
            Điểm Danh Lớp Học Phần
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {" "}
            Quản lý chuyên cần hàng ngày và tự động tích lũy điểm chuyên cần học
            phần cho sinh viên
          </p>
        </div>{" "}
        {/* Date Selection Panel */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Chọn Ngày Học
            </label>
            <input
              type="date"
              max={getTodayString()}
              // Disable future dates in datepicker
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-semibold text-DEFAULT focus:outline-none focus:border-indigo-500 cursor-pointer transition duration-150"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div>
            {" "}
            {hasExisting && !isFutureDate() && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-backgroundmerald-500/10 text-emerald-400 border border-emerald-500/20">
                {" "}
                ✓ Đã điểm danh ngày này
              </span>
            )}{" "}
            {!hasExisting && !isFutureDate() && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {" "}
                ⚠ Chưa điểm danh ngày này
              </span>
            )}
          </div>
        </div>{" "}
        {/* Future Date Constraint Alert Banner */}{" "}
        {isFutureDate() && (
          <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-2">
            <span className="text-4xl">
              <Calendar className="w-4 h-4 inline-block mr-1" />
            </span>
            <h3 className="text-base font-extrabold text-rose-455 text-rose-400">
              Không thể điểm danh cho buổi học chưa diễn ra!
            </h3>
            <p className="text-xs text-slate-400">
              Vui lòng thay đổi ngày học về hôm nay hoặc một buổi học trong quá
              khứ.
            </p>
          </div>
        )}{" "}
        {/* Main Table view */}
        <div
          className={`bg-slate-850 border border-border rounded-xl shadow-xl overflow-hidden transition ${isFutureDate() ? "opacity-40 pointer-events-none select-none blur-xs" : ""}`}
        >
          {" "}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 font-medium">
                Đang tải danh sách học viên...
              </span>
            </div>
          ) : students.length === 0 ? (
            <div className="p-20 text-center">
              <div className="text-6xl mb-4">
                <Users className="w-4 h-4 inline-block mr-1" />
              </div>
              <h3 className="text-lg font-bold text-slate-300">
                Không có sinh viên nào đăng ký
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Lớp học phần này hiện chưa có sinh viên đăng ký lớp học.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveClick}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface border-b border-border text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Họ và Tên</th>
                      <th className="px-6 py-4">Mã Sinh Viên</th>
                      <th className="px-6 py-4">Trạng Thái Điểm Danh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {" "}
                    {students.map((st) => (
                      <tr
                        key={st._id}
                        className="hover:bg-slate-700/10 transition duration-150"
                      >
                        <td className="px-6 py-4 font-bold text-DEFAULT">
                          {st.fullName}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                          {st.userId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-4">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${st._id}`}
                                value="present"
                                checked={records[st._id] === "present"}
                                onChange={() =>
                                  handleStatusChange(st._id, "present")
                                }
                                className="text-emerald-500 focus:ring-emerald-500 bg-background border-border cursor-pointer"
                              />
                              <span className="text-xs font-bold text-muted">
                                Đi học
                              </span>
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${st._id}`}
                                value="absent"
                                checked={records[st._id] === "absent"}
                                onChange={() =>
                                  handleStatusChange(st._id, "absent")
                                }
                                className="text-rose-500 focus:ring-rose-500 bg-background border-border cursor-pointer"
                              />
                              <span className="text-xs font-bold text-muted">
                                Vắng
                              </span>
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${st._id}`}
                                value="excused"
                                checked={records[st._id] === "excused"}
                                onChange={() =>
                                  handleStatusChange(st._id, "excused")
                                }
                                className="text-amber-500 focus:ring-amber-500 bg-background border-border cursor-pointer"
                              />
                              <span className="text-xs font-bold text-muted">
                                Có phép
                              </span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-5 bg-surface/50 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg shadow-lg hover:shadow-indigo-500/15 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {" "}
                  {submitting ? "Đang lưu..." : "Lưu điểm danh"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>{" "}
      {/* Overwrite Confirmation Dialog Modal */}{" "}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-backgroundlack/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <span className="text-5xl text-amber-550 text-amber-500 block">
              <AlertTriangle className="w-4 h-4 inline-block mr-1" />
            </span>
            <h3 className="text-lg font-bold text-slate-150">
              Xác Nhận Cập Nhật
            </h3>
            <p className="text-sm text-slate-300">
              {" "}
              Dữ liệu điểm danh của ngày này đã tồn tại. Bạn có chắc chắn muốn
              cập nhật lại?
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-DEFAULT bg-slate-750 hover:bg-slate-700 rounded-lg border border-border transition cursor-pointer"
              >
                {" "}
                Hủy bỏ
              </button>
              <button
                onClick={submitAttendance}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-605 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-lg hover:shadow-indigo-550/10 transition cursor-pointer"
              >
                {" "}
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassAttendance;
