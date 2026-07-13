import { useState, useEffect } from "react";
import { RefreshCw, Calendar, School, AlertTriangle, BookOpen } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const InstructorClassList = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorAlert, setErrorAlert] = useState("");

  // Fetch instructor teaching classes
  const fetchTeachingClasses = async () => {
    setLoading(true);
    setErrorAlert("");
    try {
      const response = await axios.get(
        "http://localhost:5000/api/schedules/teaching-schedule",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setClasses(response.data || []);
    } catch {
      setErrorAlert("Không thể tải danh sách lớp học phần!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTeachingClasses();
  }, [token]);

  return (
    <div className="flex-1 w-full bg-background text-DEFAULT transition-colors duration-150 min-h-screen">
      <div className="max-w-6xl w-full mx-auto p-6 space-y-6">
        
        {/* Header bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
              Quản Lý Lớp Học Phần
            </h1>
            <p className="text-muted mt-1 text-sm">
              Quản lý thông tin, học liệu, điểm danh và điểm số của các lớp học phần được phân công.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/instructor/schedule")}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-surface hover:bg-background border border-border rounded-md transition duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <Calendar size={12} />
              Lịch giảng dạy
            </button>
            <button
              onClick={fetchTeachingClasses}
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
          <div className="flex flex-col items-center justify-center p-24 gap-3 bg-surface border border-border rounded-md shadow-sm">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang tìm lớp phân công giảng dạy...
            </span>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-surface border border-border border-dashed rounded-md p-20 flex flex-col items-center justify-center text-center shadow-sm">
            <School className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">
              Không có lớp học phần
            </h3>
            <p className="text-muted mt-2 text-sm">
              Hiện tại chưa có lớp học phần nào được phân công giảng dạy.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="bg-surface border border-border rounded-md p-4 hover:border-primary transition-colors duration-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-primary/10 rounded-md flex-shrink-0">
                    <School className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3
                      className="text-base font-bold text-DEFAULT hover:text-primary transition cursor-pointer"
                      onClick={() => navigate(`/instructor/classes/${cls.classId}`)}
                    >
                      {cls.subject?.subjectName || "N/A"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mt-1 font-mono">
                      <span>Mã lớp: {cls.classId}</span>
                      <span>•</span>
                      <span>Học kỳ: {cls.semester?.semesterName || "-"}</span>
                      <span>•</span>
                      <span>Số tín chỉ: {cls.subject?.credits || 0} tín chỉ</span>
                      <span>•</span>
                      <span>Phòng: {cls.room}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto border-t md:border-t-0 border-border pt-3 md:pt-0">
                  <button
                    onClick={() => navigate(`/instructor/classes/${cls.classId}?tab=grades`)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-md transition duration-150 cursor-pointer border-none"
                  >
                    Nhập điểm
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/classes/${cls.classId}?tab=attendance`)}
                    className="px-3.5 py-1.5 text-xs font-bold text-muted hover:text-DEFAULT bg-transparent border border-border hover:bg-background rounded-md transition duration-150 cursor-pointer"
                  >
                    Điểm danh
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/classes/${cls.classId}?tab=materials`)}
                    className="px-3.5 py-1.5 text-xs font-bold text-muted hover:text-DEFAULT bg-transparent border border-border hover:bg-background rounded-md transition duration-150 cursor-pointer"
                  >
                    Học liệu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorClassList;
