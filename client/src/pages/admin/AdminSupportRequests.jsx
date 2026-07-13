import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  User, 
  Inbox,
  Loader2
} from "lucide-react";

const AdminSupportRequests = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form inputs state
  const [status, setStatus] = useState("pending");
  const [response, setResponse] = useState("");

  // 1. CHUYỂN KHAI BÁO ALERT VÀ SHOWALERT LÊN TRÊN CÙNG
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

  // 2. BÂY GIỜ FETCH REQUESTS CÓ THỂ GỌI SHOWALERT THOẢI MÁI
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/support/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data || []);
    } catch (err) {
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
        "Vui lòng nhập nội dung phản hồi chi tiết trước khi đóng yêu cầu!",
        "error"
      );
      return;
    }
    
    try {
      await axios.put(
        `http://localhost:5000/api/support/${selectedRequest._id}`,
        { status, response },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert("Xử lý yêu cầu thành công!", "success");
      setModalOpen(false);
      fetchRequests(); // Refresh table list
    } catch (err) {
      showAlert(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật!", "error");
    }
  };

  const displayDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  return (
    <div className="flex-1 w-full flex flex-col">
      {/* Custom Toast Alert */}
      {alert.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center px-4 py-3 rounded-md shadow-lg transition-all duration-300 transform translate-y-0 border ${
            alert.type === "success"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-primary/10 text-primary border-primary/20"
          }`}
        >
          <span className="mr-2">
            {alert.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </span>
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Main content grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-DEFAULT">
            Giải Quyết Yêu Cầu Hỗ Trợ
          </h1>
          <p className="text-muted mt-1 text-sm">
            Theo dõi ý kiến phản hồi, khiếu nại điểm số, hỗ trợ học phí và dịch vụ công từ sinh viên
          </p>
        </div>

        {/* Table list view */}
        <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden animate-fade-in">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <Loader2 className="w-8 h-8 text-muted animate-spin" />
              <span className="text-muted font-medium animate-pulse text-sm">
                Đang tải danh sách yêu cầu...
              </span>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="p-4 bg-background rounded-full mb-4 border border-border">
                <Inbox className="w-10 h-10 text-muted" />
              </div>
              <h3 className="text-lg font-bold text-DEFAULT">
                Không có yêu cầu hỗ trợ nào
              </h3>
              <p className="text-muted mt-1 text-sm max-w-md mx-auto">
                Hộp thư hỗ trợ gửi đến Admin đang trống.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Sinh Viên</th>
                    <th className="px-6 py-4">Tiêu Đề</th>
                    <th className="px-6 py-4">Thời Gian Gửi</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4">Giải Quyết Bởi</th>
                    <th className="px-6 py-4 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {requests.map((req) => (
                    <tr
                      key={req._id}
                      className="hover:bg-background/80 transition duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="block font-semibold text-DEFAULT">
                          {req.student?.fullName || "-"}
                        </span>
                        <span className="text-xs text-muted font-mono">
                          MS: {req.student?.userId || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-DEFAULT font-medium">
                        {req.title}
                      </td>
                      <td className="px-6 py-4 text-muted text-xs">
                        {displayDate(req.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {req.status === "pending" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Chờ xử lý
                          </span>
                        )}
                        {req.status === "in_progress" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            Đang xử lý
                          </span>
                        )}
                        {req.status === "resolved" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Đã giải quyết
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {req.resolvedBy ? (
                          req.resolvedBy.fullName
                        ) : (
                          <span className="italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(req)}
                          className="px-3 py-1.5 bg-transparent hover:bg-background border border-border text-muted hover:text-DEFAULT rounded-md text-xs font-medium transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-bold text-DEFAULT flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Chi Tiết Yêu Cầu Hỗ Trợ
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-DEFAULT transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Student Metadata Card */}
              <div className="bg-background border border-border rounded-md p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="block text-muted font-semibold uppercase tracking-wider mb-1">
                    Họ và tên
                  </span>
                  <span className="text-DEFAULT font-bold text-sm block">
                    {selectedRequest.student?.fullName || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted font-semibold uppercase tracking-wider mb-1">
                    Mã số sinh viên
                  </span>
                  <span className="text-DEFAULT font-mono text-sm block">
                    {selectedRequest.student?.userId || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted font-semibold uppercase tracking-wider mb-1">
                    Địa chỉ Email
                  </span>
                  <span className="text-DEFAULT font-mono block">
                    {selectedRequest.student?.email || "-"}
                  </span>
                </div>
              </div>

              {/* Ticket Content */}
              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Tiêu đề yêu cầu
                </span>
                <h4 className="text-base font-bold text-primary">
                  {selectedRequest.title}
                </h4>
              </div>
              
              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Nội dung chi tiết
                </span>
                <p className="bg-background border border-border rounded-md p-3 text-sm text-DEFAULT whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {selectedRequest.content}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status select */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Trạng thái xử lý
                  </label>
                  <select
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết</option>
                  </select>
                </div>
                
                {/* ResolvedBy field (if exists) */}
                {selectedRequest.resolvedBy && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                      Người xử lý trước đó
                    </label>
                    <div className="bg-background border border-border rounded-md px-3 py-2 text-sm text-muted font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedRequest.resolvedBy.fullName}
                    </div>
                  </div>
                )}
              </div>

              {/* Response textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Nội dung phản hồi chi tiết
                </label>
                <textarea
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] placeholder:text-muted/50 transition-colors"
                  placeholder="Nhập nội dung phản hồi, câu trả lời giải đáp thắc mắc cho sinh viên..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-background text-muted hover:text-DEFAULT rounded-md text-sm font-medium transition cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-md shadow-sm text-sm font-medium transition cursor-pointer"
                >
                  Lưu phản hồi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportRequests;