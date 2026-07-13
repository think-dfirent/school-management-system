import { useState, useEffect } from "react";
import { Upload, Trash2, CheckCircle, AlertTriangle, FileText, FolderPlus, Calendar, Eye } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const InstructorMaterialsTab = ({ classId }) => {
  const token = useAuthStore((state) => state.token);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("lecture");
  const [file, setFile] = useState(null);
  const [dueDate, setDueDate] = useState("");

  // Alert toast state
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/materials/${classId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMaterials(res.data || []);
    } catch {
      showAlert("Lỗi khi tải danh sách học liệu!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId && token) {
      fetchMaterials();
    }
  }, [classId, token]);

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "success" });
    }, 5000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDelete = async (materialId) => {
    const confirm = window.confirm(
      "Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.",
    );
    if (!confirm) return;
    try {
      await axios.delete(`http://localhost:5000/api/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showAlert("Xóa tài liệu học phần thành công!", "success");
      setMaterials((prev) => prev.filter((item) => item._id !== materialId));
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Lỗi khi xóa tài liệu!",
        "error",
      );
    }
  };

  const openUploadModal = () => {
    setTitle("");
    setDescription("");
    setType("lecture");
    setFile(null);
    setDueDate("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !type) {
      showAlert("Vui lòng nhập đầy đủ các thông tin bắt buộc!", "error");
      return;
    }
    if (!file) {
      showAlert("Vui lòng chọn tệp tin cần tải lên!", "error");
      return;
    }
    if (type === "assignment" && !dueDate) {
      showAlert("Vui lòng nhập hạn nộp bài cho bài tập lớn!", "error");
      return;
    }
    if (type === "assignment" && new Date(dueDate).getTime() < Date.now()) {
      showAlert("Hạn nộp bài phải lớn hơn thời gian hiện tại!", "error");
      return;
    }
    setSubmitting(true);

    const formDataPayload = new FormData();
    formDataPayload.append("classId", classId);
    formDataPayload.append("title", title);
    formDataPayload.append("description", description);
    formDataPayload.append("type", type);
    formDataPayload.append("file", file);

    if (type === "assignment") {
      formDataPayload.append("dueDate", dueDate);
    }
    try {
      await axios.post("http://localhost:5000/api/materials", formDataPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showAlert("Đăng tải nội dung thành công!", "success");
      setModalOpen(false);
      fetchMaterials();
    } catch (err) {
      showAlert(err.response?.data?.message || "Lỗi khi tải tệp lên!", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const getMaterialBadge = (type) => {
    switch (type) {
      case "lecture":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Bài giảng
          </span>
        );
      case "document":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Tài liệu
          </span>
        );
      case "assignment":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            Bài tập lớn
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 relative animate-in fade-in duration-200">
      
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-DEFAULT">
            Quản Lý Học Liệu &amp; Bài Tập
          </h3>
          <p className="text-xs text-muted mt-0.5 font-medium">
            Đăng tải slide bài giảng, giáo trình PDF học phần và phân công bài tập lớn
          </p>
        </div>
        <button
          onClick={openUploadModal}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-md shadow-sm transition cursor-pointer border-none flex items-center gap-1.5"
        >
          <FolderPlus size={14} />
          Đăng tải học liệu
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface border border-border rounded-md shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted text-xs font-medium animate-pulse">
            Đang tải danh sách học liệu...
          </span>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-400">
            Chưa có tài liệu học tập
          </h4>
          <p className="text-xs text-muted mt-1">
            Lớp học phần này hiện chưa được giảng viên đăng tải slide bài giảng hoặc bài tập lớn.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Học liệu / Tên bài đăng</th>
                  <th className="px-6 py-4">Phân loại</th>
                  <th className="px-6 py-4">Hạn nộp bài (Bài tập)</th>
                  <th className="px-6 py-4">Hành động</th>
                  <th className="px-6 py-4 text-center">Thời gian tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium">
                {materials.map((mat) => (
                  <tr
                    key={mat._id}
                    className="hover:bg-background/80 transition duration-150 border-b border-border"
                  >
                    <td className="px-6 py-4">
                      <span className="block font-bold text-DEFAULT">
                        {mat.title}
                      </span>
                      {mat.description && (
                        <span className="text-[10px] text-muted block mt-0.5">
                          {mat.description}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getMaterialBadge(mat.type)}</td>
                    <td className="px-6 py-4 font-mono text-[10px] text-DEFAULT font-semibold">
                      {mat.type === "assignment" ? (
                        formatDueDate(mat.dueDate)
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(mat._id)}
                        className="text-primary hover:text-primary-hover font-semibold cursor-pointer text-xs flex items-center gap-1 bg-transparent border-none p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa tài liệu
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center text-muted font-mono">
                      {new Date(mat.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-background/50 px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-bold text-DEFAULT flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-primary" />
                Đăng Tải Học Liệu Học Phần
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-DEFAULT transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                  Tiêu đề tài liệu <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-background border border-border focus:ring-1 focus:ring-primary focus:border-primary rounded-md px-3.5 py-2 text-xs text-DEFAULT focus:outline-none transition"
                  placeholder="Ví dụ: Slide bài giảng chương 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                  Mô tả chi tiết
                </label>
                <textarea
                  className="w-full bg-background border border-border focus:ring-1 focus:ring-primary focus:border-primary rounded-md px-3.5 py-2 text-xs text-DEFAULT focus:outline-none min-h-[60px] transition"
                  placeholder="Nhập ghi chú hoặc yêu cầu của tài liệu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Type Select */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                  Phân loại học liệu <span className="text-primary">*</span>
                </label>
                <select
                  className="w-full bg-background border border-border focus:ring-1 focus:ring-primary focus:border-primary rounded-md px-3.5 py-2 text-xs text-DEFAULT focus:outline-none cursor-pointer transition"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="lecture">Lecture (Bài giảng)</option>
                  <option value="document">Document (Tài liệu học tập)</option>
                  <option value="assignment">Assignment (Bài tập lớn)</option>
                </select>
              </div>

              {/* Conditional Due Date input */}
              {type === "assignment" && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                    Hạn nộp bài tập lớn <span className="text-primary">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full bg-background border border-border focus:ring-1 focus:ring-primary focus:border-primary rounded-md px-3.5 py-2 text-xs text-DEFAULT focus:outline-none cursor-pointer transition"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              )}

              {/* File Upload input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                  Tệp tin tài liệu (Tối đa 50MB) <span className="text-primary">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md bg-background/20">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-10 w-10 text-slate-500" />
                    <div className="flex text-xs text-slate-400 justify-center">
                      <label
                        htmlFor="file-upload-tab"
                        className="relative cursor-pointer rounded-md font-bold text-primary hover:text-primary/80 focus-within:outline-none"
                      >
                        <span>Chọn tệp tin để tải lên</span>
                        <input
                          id="file-upload-tab"
                          name="file-upload-tab"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-[9px] text-muted">
                      Hỗ trợ các định dạng ngoại trừ tệp thực thi (.exe, .bat, v.v.)
                    </p>
                    {file && (
                      <p className="text-xs text-primary font-bold font-mono truncate max-w-xs mt-2">
                        📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border bg-transparent text-muted hover:text-DEFAULT rounded-md text-xs font-semibold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-xs font-bold transition disabled:opacity-50 cursor-pointer border-none"
                >
                  {submitting ? "Đang đăng tải..." : "Lưu lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorMaterialsTab;
