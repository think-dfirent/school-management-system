import { useState, useEffect } from "react";
import {
  User,
  BookOpen,
  Calendar,
  School,
  Mail,
  Trash2,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const StudentSupport = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // Form inputs state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState("admin");
  const [relatedClass, setRelatedClass] = useState("");

  // Classes list fetched
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Support requests history states
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  // Alert toast state (Hoisted to top)
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

  // Fetch enrolled classes on mount for the dropdown
  const fetchEnrolledClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/support/my-enrolled-classes",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEnrolledClasses(res.data || []);
    } catch {
      showAlert("Lỗi khi nạp danh sách lớp học phần đăng ký!", "error");
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch personal support requests history
  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await axios.get("http://localhost:5000/api/support/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data || []);
    } catch {
      showAlert("Lỗi khi nạp lịch sử yêu cầu hỗ trợ!", "error");
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchEnrolledClasses();
    fetchRequests();
  }, [token]);

  const handleEditClick = (reqItem) => {
    setEditingRequest(reqItem);
    setTitle(reqItem.title);
    setContent(reqItem.content);
    setRecipientType(reqItem.recipientType);
    setRelatedClass(reqItem.relatedClass?._id || reqItem.relatedClass || "");
  };

  const cancelEdit = () => {
    setEditingRequest(null);
    setTitle("");
    setContent("");
    setRecipientType("admin");
    setRelatedClass("");
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Bạn có chắc chắn muốn xóa yêu cầu này? Hành động này không thể hoàn tác.",
    );

    if (!confirm) return;
    try {
      await axios.delete(`http://localhost:5000/api/support/student/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showAlert("Xóa yêu cầu thành công!", "success");
      setRequests((prev) => prev.filter((req) => req._id !== id));

      if (editingRequest?._id === id) {
        cancelEdit();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Lỗi khi xóa yêu cầu!", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !recipientType) {
      showAlert("Vui lòng nhập đầy đủ thông tin bắt buộc!", "error");
      return;
    }
    if (recipientType === "instructor" && !relatedClass) {
      showAlert(
        "Vui lòng chọn lớp học phần liên quan khi gửi cho giảng viên!",
        "error",
      );
      return;
    }
    setSubmitting(true);

    try {
      const payload = {
        title,
        content,
        recipientType,
        relatedClass: recipientType === "instructor" ? relatedClass : undefined,
      };

      if (editingRequest) {
        await axios.put(
          `http://localhost:5000/api/support/student/${editingRequest._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert("Cập nhật yêu cầu thành công!", "success");
      } else {
        await axios.post("http://localhost:5000/api/support/student", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showAlert("Gửi yêu cầu thành công!", "success");
      }
      setEditingRequest(null);
      setTitle("");
      setContent("");
      setRecipientType("admin");
      setRelatedClass("");
      fetchRequests();
    } catch (err) {
      showAlert(
        err.response?.data?.message ||
          "Không thể thực hiện yêu cầu lúc này, vui lòng thử lại sau.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle size={10} className="mr-1" />
            Đã giải quyết
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Clock size={10} className="mr-1 animate-pulse" />
            Đang xử lý
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock size={10} className="mr-1" />
            Chưa xử lý
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-DEFAULT font-sans flex flex-col relative pb-12 transition-colors duration-150">
      
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

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-8 flex flex-col justify-center">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
            Gửi Yêu Cầu Hỗ Trợ Học Vụ
          </h1>
          <p className="text-muted mt-1.5 text-sm leading-relaxed">
            Học viên có thể gửi thắc mắc liên quan tới quy chế, điểm số học phần tới Phòng Đào tạo hoặc Giảng viên phụ trách lớp học phần.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface border border-border rounded-md shadow-sm p-6">
          <h2 className="text-sm font-bold text-DEFAULT uppercase tracking-wider mb-4 flex items-center gap-2">
            {editingRequest ? (
              <span className="flex items-center gap-1.5">
                <BookOpen size={16} />
                Chỉnh sửa yêu cầu hỗ trợ
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Mail size={16} />
                Tạo yêu cầu hỗ trợ mới
              </span>
            )}
            {editingRequest && (
              <span className="text-[10px] text-amber-500 font-mono lowercase">
                (ID: {editingRequest._id.slice(-6)})
              </span>
            )}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Tiêu đề yêu cầu <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                className="w-full bg-background border border-border rounded-md px-3.5 py-2.5 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow duration-150"
                placeholder="Ví dụ: Thắc mắc về lịch thi, điểm chuyên cần..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Recipient Type */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Nơi tiếp nhận xử lý <span className="text-primary">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-DEFAULT cursor-pointer select-none">
                  <input
                    type="radio"
                    name="recipientType"
                    value="admin"
                    checked={recipientType === "admin"}
                    onChange={() => {
                      setRecipientType("admin");
                      setRelatedClass("");
                    }}
                    className="accent-primary cursor-pointer"
                  />
                  Phòng Đào tạo / Admin
                </label>
                <label className="flex items-center gap-2 text-sm text-DEFAULT cursor-pointer select-none">
                  <input
                    type="radio"
                    name="recipientType"
                    value="instructor"
                    checked={recipientType === "instructor"}
                    onChange={() => setRecipientType("instructor")}
                    className="accent-primary cursor-pointer"
                  />
                  Giảng viên phụ trách
                </label>
              </div>
            </div>

            {/* Conditional Enrolled Classes Dropdown */}
            {recipientType === "instructor" && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Lớp học phần liên quan <span className="text-primary">*</span>
                </label>
                {loadingClasses ? (
                  <div className="text-xs text-muted italic py-2">
                    Đang tải danh sách lớp học đăng ký...
                  </div>
                ) : enrolledClasses.length === 0 ? (
                  <div className="text-xs text-primary font-semibold py-2">
                    Bạn hiện chưa đăng ký lớp học phần nào hoạt động!
                  </div>
                ) : (
                  <select
                    className="w-full bg-background border border-border rounded-md px-3.5 py-2.5 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition cursor-pointer"
                    value={relatedClass}
                    onChange={(e) => setRelatedClass(e.target.value)}
                  >
                    <option value="">-- Chọn lớp học phần liên quan --</option>
                    {enrolledClasses.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.subject?.subjectName} ({cls.classId})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Content */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Nội dung chi tiết yêu cầu <span className="text-primary">*</span>
              </label>
              <textarea
                className="w-full bg-background border border-border rounded-md px-3.5 py-2.5 text-sm text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition min-h-[120px] resize-y"
                placeholder="Mô tả chi tiết thắc mắc của bạn..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Submit Button & Cancel button */}
            <div className="pt-2 flex gap-3">
              {editingRequest && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-3 bg-transparent border border-border text-muted hover:text-DEFAULT hover:bg-background rounded-md text-xs font-semibold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="py-3 bg-primary hover:bg-primary/90 text-white rounded-md text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer text-center border-none"
                style={{ flexGrow: editingRequest ? 2 : 1 }}
              >
                {submitting
                  ? "Đang xử lý..."
                  : editingRequest
                    ? "Cập nhật yêu cầu"
                    : "Gửi yêu cầu hỗ trợ"}
              </button>
            </div>
          </form>
        </div>

        {/* History Stack */}
        <div className="bg-surface border border-border rounded-md shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-DEFAULT uppercase tracking-wider">
              Lịch sử yêu cầu hỗ trợ
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              Danh sách các yêu cầu hỗ trợ học vụ bạn đã gửi đến hệ thống
            </p>
          </div>

          {loadingRequests ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted text-xs font-medium animate-pulse">
                Đang tải lịch sử...
              </span>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-md bg-background/30">
              <Mail className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <span className="text-muted text-xs font-medium block">
                Bạn chưa gửi bất kỳ yêu cầu hỗ trợ nào.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
                const isPending = req.status === "pending";
                return (
                  <div
                    key={req._id}
                    className={`p-4 rounded-md border border-border bg-background/50 space-y-3 transition duration-150 ${
                      editingRequest?._id === req._id ? "border-primary/50 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-DEFAULT leading-snug">
                          {req.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(req.createdAt).toLocaleString("vi-VN")}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Gửi:{" "}
                            {req.recipientType === "admin" ? (
                              <span className="inline-flex items-center gap-1 font-semibold">
                                <School size={12} className="text-primary" /> Phòng Đào tạo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold">
                                <User size={12} className="text-primary" /> Giảng viên
                              </span>
                            )}
                          </span>
                        </div>
                        {req.recipientType === "instructor" && req.relatedClass && (
                          <div className="text-[9px] text-muted font-mono">
                            Lớp: {req.relatedClass?.subject?.subjectName} ({req.relatedClass?.classId})
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                    
                    <p className="text-xs text-DEFAULT bg-background/50 p-3 rounded border border-border leading-relaxed whitespace-pre-wrap">
                      {req.content}
                    </p>

                    {/* Reply / Response from admin/lecturer */}
                    {req.response && (
                      <div className="bg-primary/5 border border-primary/10 rounded-md p-3 space-y-1 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-wider">
                          <MessageSquare size={12} />
                          <span>
                            {req.recipientType === "admin"
                              ? "Phản hồi của Phòng đào tạo"
                              : "Phản hồi của Giảng viên"}
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">
                          {req.response}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {isPending && (
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border mt-2">
                        <button
                          onClick={() => handleEditClick(req)}
                          className="text-[10px] font-bold text-amber-500 hover:text-amber-400 transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 size={12} />
                          Sửa yêu cầu
                        </button>
                        <button
                          onClick={() => handleDelete(req._id)}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-455 transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Xóa yêu cầu
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentSupport;
