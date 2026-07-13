import { useState, useEffect } from "react";
import { MapPin, AlertTriangle, CheckCircle, X, BookOpen } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const CourseRegistration = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // Initial States
  const [isOpen, setIsOpen] = useState(true);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [semesterName, setSemesterName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Toast alert state (Hoisted to top)
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

  // Fetch registration data
  const fetchRegistrationData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/registrations",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const {
        isOpen: openStatus,
        availableClasses: avail,
        enrolledClasses: enrolled,
        semesterName: sem,
        message: msg,
      } = response.data;
      setIsOpen(openStatus);
      setAvailableClasses(avail || []);
      setEnrolledClasses(enrolled || []);
      setSemesterName(sem || "");
      setMessage(msg || "");
    } catch {
      showAlert("Lỗi khi tải danh sách đăng ký tín chỉ!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchRegistrationData();
  }, [token]);

  // Perform registration call
  const handleRegister = async (classId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/registrations",
        { classId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert("Đăng ký thành công", "success");
      fetchRegistrationData();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể hoàn tất đăng ký môn học!",
        "error",
      );
    }
  };

  // Perform cancellation call
  const handleCancel = async (classId) => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn hủy đăng ký lớp học phần này? Hành động này không thể hoàn tác.",
    );

    if (!confirmed) return;
    try {
      await axios.delete(`http://localhost:5000/api/registrations/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showAlert("Hủy đăng ký thành công!", "success");
      fetchRegistrationData();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể hoàn tất hủy đăng ký môn học!",
        "error",
      );
    }
  };

  // Formatter for schedules output
  const formatSchedule = (scheds) => {
    if (!scheds || scheds.length === 0) return "-";
    return scheds
      .map((s) => {
        const dayText = s.dayOfWeek === 8 ? "Chủ Nhật" : `Thứ ${s.dayOfWeek}`;
        return `${dayText} (Tiết ${s.startPeriod}-${s.endPeriod})`;
      })
      .join(", ");
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-background text-DEFAULT transition-colors duration-150">
      
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

      {/* Main content grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
            Đăng Ký Môn Học Trực Tuyến
          </h1>
          <p className="text-muted mt-1 text-sm">
            Lựa chọn các lớp học phần và hoàn thành nghĩa vụ đăng ký tín chỉ học tập học kỳ hiện tại
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang tải thông tin đăng ký...
            </span>
          </div>
        ) : !isOpen ? (
          <div className="bg-surface border border-border rounded-md p-12 text-center shadow-sm animate-in fade-in duration-200">
            <AlertTriangle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-DEFAULT">
              Hệ thống đã khóa đăng ký
            </h2>
            <p className="text-muted mt-2 text-sm max-w-md mx-auto font-medium">
              {message ? message : "Đã hết thời gian đăng ký học phần."}
            </p>
          </div>
        ) : (
          <>
            {/* Info Card displaying current Active Semester */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Học kỳ tuyển sinh hiện tại
                </span>
                <h2 className="text-xl font-extrabold text-primary mt-0.5">
                  {semesterName ? semesterName : "Học kỳ đăng ký tín chỉ"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="text-xs font-semibold text-muted">
                  Cổng đăng ký đang mở
                </span>
              </div>
            </div>

            {/* Available Classes Table */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-DEFAULT flex items-center gap-2">
                Danh sách lớp học phần khả dụng
              </h3>
              <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">
                {availableClasses.length === 0 ? (
                  <div className="p-16 text-center text-muted">
                    Không có lớp học phần nào khả dụng.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                          <th className="px-6 py-4">Mã lớp HP</th>
                          <th className="px-6 py-4">Môn học</th>
                          <th className="px-6 py-4">Giảng viên</th>
                          <th className="px-6 py-4">Lịch học / Phòng</th>
                          <th className="px-6 py-4">Sĩ số</th>
                          <th className="px-6 py-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {availableClasses.map((cls) => {
                          const isEnrolled = enrolledClasses.some(
                            (ec) => ec._id === cls._id,
                          );
                          const isFull = cls.currentStudents >= cls.maxStudents;
                          return (
                            <tr
                              key={cls._id}
                              className="hover:bg-background/80 transition duration-150"
                            >
                              <td className="px-6 py-4 font-mono text-DEFAULT font-semibold">
                                {cls.classId}
                              </td>
                              <td className="px-6 py-4">
                                <span className="block font-semibold text-DEFAULT">
                                  {cls.subject?.subjectName}
                                </span>
                                <span className="text-xs text-muted font-mono">
                                  STC: {cls.subject?.credits || 3} | Mã: {cls.subject?.subjectId}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-DEFAULT font-medium">
                                {cls.instructor?.fullName || "-"}
                              </td>
                              <td className="px-6 py-4">
                                <span className="block text-DEFAULT text-xs font-semibold">
                                  {formatSchedule(cls.schedules)}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mt-1">
                                  <MapPin size={10} className="mr-1" />
                                  {cls.room}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 w-24">
                                  <span className="font-mono text-xs text-DEFAULT">
                                    {cls.currentStudents} / {cls.maxStudents}
                                  </span>
                                  <div className="w-full bg-background border border-border h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isFull ? "bg-rose-500" : "bg-primary"}`}
                                      style={{
                                        width: `${Math.min(100, (cls.currentStudents / cls.maxStudents) * 100)}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {isEnrolled ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <CheckCircle size={10} className="mr-1" />
                                    Đã đăng ký
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleRegister(cls._id)}
                                    disabled={isFull}
                                    className={`px-4 py-1.5 text-xs font-semibold rounded-md shadow-sm transition duration-150 ${
                                      isFull 
                                        ? "bg-background border border-border text-muted cursor-not-allowed" 
                                        : "bg-primary hover:bg-primary/90 text-white cursor-pointer border-none"
                                    }`}
                                  >
                                    {isFull ? "Lớp đầy" : "Đăng ký"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* My Enrolled Classes Table */}
            <div className="space-y-3 pt-4">
              <h3 className="text-lg font-bold text-DEFAULT flex items-center gap-2">
                Học phần đã đăng ký thành công
              </h3>
              <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">
                {enrolledClasses.length === 0 ? (
                  <div className="p-16 text-center text-muted">
                    Bạn chưa đăng ký lớp học phần nào trong học kỳ này.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                          <th className="px-6 py-4">Mã lớp HP</th>
                          <th className="px-6 py-4">Môn học</th>
                          <th className="px-6 py-4">Giảng viên</th>
                          <th className="px-6 py-4">Lịch học / Phòng</th>
                          <th className="px-6 py-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {enrolledClasses.map((cls) => (
                          <tr
                            key={cls._id}
                            className="hover:bg-background/80 transition duration-150"
                          >
                            <td className="px-6 py-4 font-mono text-DEFAULT font-semibold">
                              {cls.classId}
                            </td>
                            <td className="px-6 py-4">
                              <span className="block font-semibold text-DEFAULT">
                                {cls.subject?.subjectName}
                              </span>
                              <span className="text-xs text-muted font-mono">
                                STC: {cls.subject?.credits || 3} | Mã: {cls.subject?.subjectId}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-DEFAULT font-medium">
                              {cls.instructor?.fullName || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="block text-DEFAULT text-xs font-semibold">
                                {formatSchedule(cls.schedules)}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mt-1">
                                <MapPin size={10} className="mr-1" />
                                {cls.room}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleCancel(cls._id)}
                                className="border border-primary/30 text-primary hover:bg-primary/10 rounded-md px-3.5 py-1.5 text-xs font-semibold transition duration-150 cursor-pointer"
                              >
                                Hủy đăng ký
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseRegistration;
