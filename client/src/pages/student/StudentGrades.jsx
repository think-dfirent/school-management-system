import { useState, useEffect } from "react";
import { RefreshCw, Calendar, GraduationCap, AlertTriangle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const StudentGrades = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [grades, setGrades] = useState([]);
  const [gpa, setGpa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorAlert, setErrorAlert] = useState("");

  // Fetch grades and GPA from backend
  const fetchGrades = async () => {
    setLoading(true);
    setErrorAlert("");
    try {
      const response = await axios.get(
        "http://localhost:5000/api/grades/my-grades",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setGrades(response.data.grades || []);
      setGpa(response.data.gpa || 0);
    } catch (err) {
      setErrorAlert(
        err.response?.data?.message || "Không thể tải bảng điểm học tập cá nhân!",
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
    fetchGrades();
  }, [token]);

  // Helper: format scores to explicit '-' if null/undefined
  const renderScore = (score) => {
    if (score === null || score === undefined) {
      return <span className="text-slate-500 font-bold">-</span>;
    }
    return <span className="font-mono font-semibold text-DEFAULT">{score}</span>;
  };

  // Helper: get colored badge for Pass / Fail status
  const renderStatusBadge = (status) => {
    if (status === "Chưa có điểm") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-transparent border border-border text-muted">
          Chưa có điểm
        </span>
      );
    }
    if (status === "Đạt") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          Đạt
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
        Không đạt
      </span>
    );
  };

  // Helper: get colored badge for letter grade (A, B, C, D, F)
  const renderLetterGradeBadge = (letter) => {
    if (!letter || letter === "-") {
      return <span className="text-slate-500 font-normal">-</span>;
    }
    const firstChar = letter.charAt(0);
    let badgeStyle = "bg-slate-500/10 text-slate-500 border border-slate-500/20";
    if (firstChar === "A") {
      badgeStyle = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    } else if (firstChar === "B") {
      badgeStyle = "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    } else if (firstChar === "C") {
      badgeStyle = "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
    } else if (firstChar === "D") {
      badgeStyle = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    } else if (firstChar === "F") {
      badgeStyle = "bg-primary/10 text-primary border border-primary/20";
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-mono ${badgeStyle}`}>
        {letter}
      </span>
    );
  };

  const convertGradeTo4Scale = (grade10) => {
    if (grade10 === null || grade10 === undefined || grade10 === "-") {
      return "-";
    }
    const val = parseFloat(grade10);
    if (isNaN(val)) {
      return "-";
    }
    if (val < 3.95) return "0";
    if (val < 4.95) return "1";
    if (val < 5.45) return "1.5";
    if (val < 6.45) return "2";
    if (val < 6.95) return "2.5";
    if (val < 7.95) return "3";
    if (val < 8.45) return "3.5";
    if (val < 8.95) return "3.7";
    return "4";
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-background text-DEFAULT transition-colors duration-150">
      
      {/* Dashboard Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
              Kết Quả Học Tập
            </h1>
            <p className="text-muted mt-1 text-sm">
              Theo dõi bảng điểm chuyên cần, giữa kỳ, thi kết thúc học phần và điểm trung bình tích lũy GPA
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/student/schedule")}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-surface hover:bg-background border border-border rounded-md transition duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <Calendar size={12} />
              Xem lịch học
            </button>
            <button
              onClick={fetchGrades}
              className="px-3 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-surface hover:bg-background border border-border rounded-md transition duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              Tải lại
            </button>
          </div>
        </div>

        {errorAlert && (
          <div className="p-4 rounded-md bg-rose-500/10 border border-primary/25 text-sm text-primary font-semibold flex items-center gap-1.5">
            <AlertTriangle size={16} />
            {errorAlert}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3 bg-surface border border-border rounded-md">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang truy xuất bảng điểm cá nhân...
            </span>
          </div>
        ) : grades.length === 0 ? (
          <div className="bg-surface border border-border border-dashed rounded-md p-20 flex flex-col items-center justify-center text-center shadow-sm">
            <GraduationCap className="w-12 h-12 text-slate-405 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">
              Chưa có kết quả học tập
            </h3>
            <p className="text-muted mt-2 text-sm max-w-md">
              Chưa có dữ liệu bảng điểm học phần nào.
            </p>
          </div>
        ) : (
          <>
            {/* GPA Summary Card */}
            <div className="bg-surface border border-border rounded-md p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Điểm trung bình học tập tích lũy
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black font-mono text-primary">
                    {gpa.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted">/ 4.0</span>
                </div>
              </div>
              <div className="bg-background/50 border border-border px-4 py-3 rounded-md text-xs space-y-1">
                <p className="text-muted font-medium">Quy đổi xếp loại học lực:</p>
                <div className="flex gap-4 font-mono font-semibold text-DEFAULT">
                  <span>GPA ≥ 3.6: Xuất sắc</span>
                  <span>GPA ≥ 3.2: Giỏi</span>
                  <span>GPA ≥ 2.5: Khá</span>
                </div>
              </div>
            </div>

            {/* Grades Data Table Card */}
            <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Môn học / Lớp HP</th>
                      <th className="px-6 py-4 text-center">Tín chỉ</th>
                      <th className="px-6 py-4 text-center">Chuyên cần</th>
                      <th className="px-6 py-4 text-center">Giữa kỳ</th>
                      <th className="px-6 py-4 text-center">Cuối kỳ</th>
                      <th className="px-6 py-4 text-center">Tổng kết (hệ 10)</th>
                      <th className="px-6 py-4 text-center">Điểm hệ 4</th>
                      <th className="px-6 py-4 text-center">Điểm chữ</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {grades.map((g) => (
                      <tr
                        key={g._id}
                        className="hover:bg-background/80 border-b border-border transition duration-150"
                      >
                        <td className="px-6 py-4">
                          <span className="block font-semibold text-DEFAULT">
                            {g.subjectName}
                          </span>
                          <span className="text-xs text-muted font-mono">
                            Lớp: {g.classId}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-medium text-DEFAULT">
                          {g.credits}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderScore(g.attendanceScore)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderScore(g.midtermScore)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderScore(g.finalScore)}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-DEFAULT">
                          {g.totalScore !== null ? (
                            g.totalScore
                          ) : (
                            <span className="text-slate-500 font-normal">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-DEFAULT">
                          {g.totalScore !== null ? (
                            convertGradeTo4Scale(g.totalScore)
                          ) : (
                            <span className="text-slate-500 font-normal">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {g.letterGrade !== null ? (
                            renderLetterGradeBadge(g.letterGrade)
                          ) : (
                            <span className="text-slate-500 font-normal">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatusBadge(g.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentGrades;
