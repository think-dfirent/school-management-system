import React, { useState, useEffect } from "react";
import { BookOpen, Users, Download } from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
const InstructorStudentList = () => {
  const { classId } = useParams();

  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);

  const currentUser = useAuthStore((state) => state.user);

  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);

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

  // Fetch class students list
  const fetchStudents = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/classes/${classId}/students`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEnrollments(response.data || []);
    } catch (err) {
      // Exception 3.1: Security Error Handling & Redirect
      if (err.response?.status === 403) {
        const errMsg =
          err.response?.data?.message ||
          "Bạn không có quyền xem danh sách của lớp học phần này.";
        showToast(errMsg, "error");

        // Redirect back to instructor schedule page after a brief delay so toast is visible
        setTimeout(() => {
          navigate("/instructor/schedule");
        }, 2000);
      } else {
        showToast(
          err.response?.data?.message || "Không thể tải danh sách sinh viên!",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchStudents();
  }, [token, classId]);

  // Helper: format birth date to DD/MM/YYYY
  const formatDOB = (dobStr) => {
    if (!dobStr) return "-";
    const d = new Date(dobStr);

    const day = String(d.getDate()).padStart(2, "0");

    const month = String(d.getMonth() + 1).padStart(2, "0");

    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex-1 w-full flex flex-col">
      {" "}
      {/* Toast popup */}{" "}
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
      {/* Header bar */} {/* Dashboard Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              {" "}
              Danh Sách Sinh Viên Lớp Học Phần
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              {" "}
              Lớp học phần:
              <span className="font-mono font-bold text-amber-400">
                {classId}
              </span>
              . Xem thông tin cá nhân và quản lý danh sách học viên đăng ký.
            </p>
          </div>
        </div>{" "}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400 font-medium animate-pulse">
              Đang tải danh sách lớp...
            </span>
          </div>
        ) : enrollments.length === 0 ? (
          // Exception 4.1: Empty State
          <div className="bg-surface border border-border border-dashed rounded-xl p-20 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="text-6xl mb-4">
              <Users className="w-4 h-4 inline-block mr-1" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">
              Không có sinh viên
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              {" "}
              Lớp học phần hiện chưa có sinh viên đăng ký.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {" "}
            {/* Action buttons panel */}
            <div className="bg-slate-850 border border-border p-4 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Hành động khả dụng
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/instructor/grades/${classId}`)}
                  className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-350 rounded-lg shadow-md transition duration-150"
                >
                  {" "}
                  <BookOpen className="w-4 h-4 inline-block mr-1" /> Nhập điểm
                  lớp
                </button>
                <button
                  onClick={() =>
                    showToast(
                      "Tính năng xuất Excel danh sách sinh viên đang được phát triển.",
                      "success",
                    )
                  }
                  className="px-4 py-2 text-xs font-bold text-DEFAULT bg-slate-805 hover:bg-slate-700 border border-border rounded-lg transition duration-150"
                >
                  {" "}
                  <Download className="w-4 h-4 inline-block mr-1" /> Xuất danh
                  sách Excel
                </button>
              </div>
            </div>{" "}
            {/* Students Roster table grid */}
            <div className="bg-slate-850 border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface border-b border-border text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4 text-center w-16">STT</th>
                      <th className="px-6 py-4">Mã sinh viên</th>
                      <th className="px-6 py-4">Họ và tên</th>
                      <th className="px-6 py-4">Ngày sinh</th>
                      <th className="px-6 py-4">Email liên hệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {" "}
                    {enrollments.map((e, index) => (
                      <tr
                        key={e._id}
                        className="hover:bg-slate-700/10 transition duration-150"
                      >
                        <td className="px-6 py-4 text-center font-mono text-muted">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-amber-400">
                          {e.student?.userId || "-"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-DEFAULT">
                          {e.student?.fullName || "-"}
                        </td>
                        <td className="px-6 py-4 font-mono text-muted">
                          {formatDOB(e.student?.dateOfBirth)}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                          {e.student?.email || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorStudentList;
