import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Mail, X, CheckCircle, AlertTriangle, User, School, Clock } from "lucide-react";

const InstructorSupportRequests = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form inputs state
  const [status, setStatus] = useState("pending");
  const [response, setResponse] = useState("");

  // Alert toast state
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

  // Fetch requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/support/instructor",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRequests(res.data || []);
    } catch {
      showAlert("Lỗi khi tải danh sách yêu cầu hỗ trợ!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchRequests();
  }, [token]);

  // Open detail modal
  const handleOpenDetail = (req) => {
    setSelectedRequest(req);
    setStatus(req.status || "pending");
    setResponse(req.response || "");
    setModalOpen(true);
  };

  // Handle Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status === "resolved" && !response.trim()) {
      showAlert(
        "Vui lòng nhập nội dung phản hồi trước khi hoàn tất xử lý!",
        "error",
      );
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/support/instructor/${selectedRequest._id}`,
        { status, response },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert("Xử lý yêu cầu thành công!", "success");
      setModalOpen(false);
      fetchRequests();
    } catch {
      showAlert("Có lỗi xảy ra khi cập nhật!", "error");
    }
  };

  const displayDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  return (
    <div className="flex-1 w-full bg-background text-DEFAULT transition-colors duration-150 min-h-screen">
      
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
      <div className="max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
            Yêu Cầu Hỗ Trợ Từ Học Viên
          </h1>
          <p className="text-muted mt-1 text-sm">
            Giải đáp các khiếu nại, thắc mắc về học phần, nội dung đào tạo và chấm điểm thi của sinh viên
          </p>
        </div>

        {/* Table list view */}
        <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted font-medium animate-pulse">
                Đang tải danh sách yêu cầu...
              </span>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center">
              <Mail className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-450">
                Không có yêu cầu hỗ trợ nào
              </h3>
              <p className="text-muted mt-1 text-sm max-w-md mx-auto">
                Chưa có sinh viên nào gửi yêu cầu hỗ trợ đến lớp học phần của thầy/cô.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Sinh Viên</th>
                    <th className="px-6 py-4">Lớp Học Phần</th>
                    <th className="px-6 py-4">Tiêu Đề</th>
                    <th className="px-6 py-4">Thời Gian Gửi</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {requests.map((req) => (
                    <tr
                      key={req._id}
                      className="hover:bg-background/80 transition duration-150 border-b border-border"
                    >
                      <td className="px-6 py-4">
                        <span className="block font-semibold text-DEFAULT">
                          {req.student?.fullName || "-"}
                        </span>
                        <span className="text-xs text-muted font-mono">
                          MS: {req.student?.userId || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-DEFAULT font-semibold">
                        {req.relatedClass?.classId || "-"}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-DEFAULT font-medium">
                        {req.title}
                      </td>
                      <td className="px-6 py-4 text-muted text-xs">
                        {displayDate(req.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {req.status === "pending" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Chờ xử lý
                          </span>
                        )}
                        {req.status === "in_progress" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            Đang xử lý
                          </span>
                        )}
                        {req.status === "resolved" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Đã giải quyết
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(req)}
                          className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md text-xs font-semibold transition border-none cursor-pointer"
                        >
                          Xem &amp; Xử lý
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

      {/* Modal Detail & Reply Form */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-md w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-background/50 px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-bold text-DEFAULT flex items-center gap-1.5">
                <Mail size={16} className="text-primary" />
                Chi Tiết Yêu Cầu Hỗ Trợ
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-DEFAULT transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Student Metadata Card */}
              <div className="bg-background border border-border rounded-md p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shadow-sm">
                <div>
                  <span className="block text-muted font-bold uppercase tracking-wider mb-0.5">
                    Họ và tên học viên
                  </span>
                  <span className="text-DEFAULT font-bold text-sm block">
                    {selectedRequest.student?.fullName || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted font-bold uppercase tracking-wider mb-0.5">
                    Mã số sinh viên
                  </span>
                  <span className="text-DEFAULT font-mono text-sm block font-semibold">
                    {selectedRequest.student?.userId || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted font-bold uppercase tracking-wider mb-0.5">
                    Lớp học phần liên quan
                  </span>
                  <span className="text-DEFAULT font-mono text-sm block font-bold">
                    {selectedRequest.relatedClass?.classId || "-"}
                  </span>
                </div>
              </div>

              {/* Ticket Content */}
              <div className="space-y-1">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Tiêu đề yêu cầu
                </span>
                <h4 className="text-base font-bold text-primary">
                  {selectedRequest.title}
                </h4>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Nội dung chi tiết
                </span>
                <p className="bg-background border border-border rounded-md p-3 text-sm text-DEFAULT whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {selectedRequest.content}
                </p>
              </div>

              {/* Status select */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Trạng thái xử lý
                </label>
                <select
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="in_progress">Đang xử lý</option>
                  <option value="resolved">Đã giải quyết</option>
                </select>
              </div>

              {/* Response textarea */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Nội dung phản hồi từ Giảng viên
                </label>
                <textarea
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-h-[100px] placeholder-slate-500"
                  placeholder="Nhập nội dung phản hồi, câu trả lời giải đáp thắc mắc về học tập cho sinh viên..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border bg-transparent text-muted hover:text-DEFAULT rounded-md text-xs font-semibold transition cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-xs font-bold transition cursor-pointer border-none shadow-sm"
                >
                  Gửi phản hồi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorSupportRequests;
