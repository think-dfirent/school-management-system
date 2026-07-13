import { useState, useEffect } from "react";
import {
  MapPin,
  ArrowLeft,
  BookOpen,
  School,
  BarChart3,
  AlertTriangle,
  Home,
  Folder,
  FileText,
  User,
  Clock,
} from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import StudentMaterialsTab from "../../components/features/StudentMaterialsTab";
import StudentAssignmentsTab from "../../components/features/StudentAssignmentsTab";

const StudentClassDashboard = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [classObj, setClassObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!classId) {
      setError("Không tìm thấy thông tin lớp học phần");
      setLoading(false);
      return;
    }
    const fetchClassDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `http://localhost:5000/api/classes/details/${classId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setClassObj(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Có lỗi xảy ra khi tải thông tin lớp học phần!",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchClassDetails();
  }, [classId, token]);

  if (error) {
    return (
      <div className="min-h-screen bg-background text-DEFAULT flex items-center justify-center p-6">
        <div className="bg-surface border border-border rounded-md p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold text-primary">Lỗi Truy Cập</h2>
          <p className="text-muted text-sm leading-relaxed">{error}</p>
          <button
            onClick={() => navigate("/student/schedule")}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-md transition cursor-pointer border-none"
          >
            Quay lại thời khóa biểu
          </button>
        </div>
      </div>
    );
  }

  const getDayName = (dayNum) => {
    if (dayNum === 8) return "Chủ Nhật";
    return `Thứ ${dayNum}`;
  };

  const formatHeaderDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-background text-DEFAULT transition-colors duration-150">
      
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted font-medium animate-pulse">
            Đang tải không gian lớp học...
          </span>
        </div>
      ) : (
        <div className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
          
          {/* Class details Banner */}
          <div className="bg-surface border border-border rounded-md p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-mono">
                  Mã lớp: {classObj?.classId}
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-mono">
                  Phòng: {classObj?.room}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-DEFAULT mt-1">
                {classObj?.subject?.subjectName}
              </h1>
              <p className="text-xs text-muted">
                Giảng viên: {classObj?.instructor?.fullName} | Học kỳ: {classObj?.semester?.semesterName} | Số tín chỉ: {classObj?.subject?.credits} tín chỉ | Thời gian học: {formatHeaderDate(classObj?.startDate)} - {formatHeaderDate(classObj?.endDate)}
              </p>
            </div>
            <button
              onClick={() => navigate("/student/schedule")}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-transparent border border-border hover:bg-background rounded-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={12} />
              Quay lại lịch học tuần
            </button>
          </div>

          {/* Tab Navigation Menu */}
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-6 text-sm font-semibold overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center ${
                  activeTab === "overview"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted hover:text-DEFAULT"
                }`}
              >
                <Home size={14} className="mr-1.5" />
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab("materials")}
                className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center ${
                  activeTab === "materials"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted hover:text-DEFAULT"
                }`}
              >
                <Folder size={14} className="mr-1.5" />
                Học liệu
              </button>
              <button
                onClick={() => setActiveTab("assignments")}
                className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center ${
                  activeTab === "assignments"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted hover:text-DEFAULT"
                }`}
              >
                <FileText size={14} className="mr-1.5" />
                Bài tập
              </button>
              <button
                onClick={() => setActiveTab("grades")}
                className={`pb-3 px-1 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center ${
                  activeTab === "grades"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted hover:text-DEFAULT"
                }`}
              >
                <BarChart3 size={14} className="mr-1.5" />
                Điểm số
              </button>
            </nav>
          </div>

          {/* Content Display Area */}
          <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden min-h-[300px]">
            
            {activeTab === "overview" && (
              <div className="p-6 space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-DEFAULT">
                    Thông tin tổng quan lớp học phần
                  </h3>
                  <p className="text-xs text-muted mt-0.5 font-medium">
                    Chi tiết thời khóa biểu, phòng học và giảng viên hướng dẫn
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Time schedules card */}
                  <div className="bg-background/50 border border-border p-5 rounded-md space-y-3 shadow-sm">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                      Thời khóa biểu
                    </span>
                    <div className="space-y-2">
                      {classObj?.schedules?.map((sched, index) => (
                        <div
                          key={index}
                          className="text-xs font-medium text-DEFAULT flex justify-between items-center bg-surface px-3 py-2 rounded border border-border"
                        >
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-muted" />
                            {getDayName(sched.dayOfWeek)}
                          </span>
                          <span className="font-mono text-DEFAULT font-bold">
                            Tiết {sched.startPeriod} - {sched.endPeriod}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Room card */}
                  <div className="bg-background/50 border border-border p-5 rounded-md flex flex-col justify-between shadow-sm">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                      Phòng học
                    </span>
                    <div className="mt-4">
                      <span className="text-3xl font-black text-DEFAULT flex items-center gap-2">
                        <School size={28} className="text-primary" />
                        {classObj?.room}
                      </span>
                      <span className="text-[10px] text-muted block mt-2">
                        Đến lớp theo đúng lịch trình phòng học quy định
                      </span>
                    </div>
                  </div>

                  {/* Instructor card */}
                  <div className="bg-background/50 border border-border p-5 rounded-md flex flex-col justify-between shadow-sm">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                      Giảng viên giảng dạy
                    </span>
                    <div className="mt-4">
                      <span className="text-base font-bold text-DEFAULT block flex items-center gap-1.5">
                        <User size={16} className="text-primary" />
                        {classObj?.instructor?.fullName}
                      </span>
                      <span className="text-[10px] text-muted font-mono block mt-1">
                        {classObj?.instructor?.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "materials" && (
              <div className="p-6 animate-in fade-in duration-200">
                <StudentMaterialsTab classId={classObj?._id} />
              </div>
            )}

            {activeTab === "assignments" && (
              <div className="p-6 animate-in fade-in duration-200">
                <StudentAssignmentsTab classId={classObj?._id} />
              </div>
            )}

            {activeTab === "grades" && (
              <div className="p-6 text-center space-y-4 animate-in fade-in duration-200">
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-slate-400">
                  Bảng Điểm Học Phần
                </h3>
                <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                  Xem điểm chuyên cần, điểm kiểm tra giữa kỳ, điểm thi cuối kỳ và phân loại kết quả học phần.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate("/student/grades")}
                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-md transition cursor-pointer border-none"
                  >
                    Chuyển sang trang Tra cứu Điểm chi tiết
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClassDashboard;
