import React, { useState, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
const CourseContentManagement = () => {
  const { classId } = useParams();

  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);

  const currentUser = useAuthStore((state) => state.user);

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

  // Fetch materials list
  const fetchMaterials = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/materials/${classId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMaterials(res.data || []);
    } catch (err) {
      showAlert("Lỗi khi tải danh sách học liệu!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (classId) {
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

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side Validation (Exception 5.1):
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
    // Exception 4.1 check for assignment dueDate in the past
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
      const res = await axios.post(
        "http://localhost:5000/api/materials",
        formDataPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      showAlert("Đăng tải nội dung thành công!", "success");
      setModalOpen(false);
      fetchMaterials();

      // Refresh table list
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
        return;
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-backgroundmerald-500/10 text-emerald-400 border border-emerald-500/20">
          Bài giảng
        </span>;
      case "document":
        return;
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-backgroundlue-500/10 text-blue-400 border border-blue-500/20">
          Tài liệu
        </span>;
      case "assignment":
        return;
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Bài tập lớn
        </span>;
      default:
        return null;
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
            Quản Lý Học Liệu &amp; Bài Tập
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {" "}
            Đăng tải bài giảng slide, giáo trình PDF học phần và phân công bài
            tập lớn có đặt hạn nộp bài
          </p>
        </div>{" "}
        {/* Table list view */}
        <div className="bg-slate-850 border border-border rounded-xl shadow-xl overflow-hidden animate-fade-in">
          {" "}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 font-medium">
                Đang tải danh sách học liệu...
              </span>
            </div>
          ) : materials.length === 0 ? (
            <div className="p-20 text-center">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-lg font-bold text-muted">
                Chưa có tài liệu học tập
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Lớp học phần này hiện chưa được giảng viên đăng tải slide bài
                giảng hoặc bài tập học phần.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-border text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Học liệu / Tên bài đăng</th>
                    <th className="px-6 py-4">Phân loại</th>
                    <th className="px-6 py-4">Hạn nộp bài (Bài tập)</th>
                    <th className="px-6 py-4">Hành động</th>
                    <th className="px-6 py-4 text-center">Thời gian tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {" "}
                  {materials.map((mat) => (
                    <tr
                      key={mat._id}
                      className="hover:bg-slate-700/10 transition duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="block font-bold text-DEFAULT">
                          {mat.title}
                        </span>{" "}
                        {mat.description && (
                          <span className="text-xs text-muted block mt-0.5">
                            {mat.description}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getMaterialBadge(mat.type)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {" "}
                        {mat.type === "assignment" ? (
                          formatDueDate(mat.dueDate)
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(mat._id)}
                          className="text-red-500 hover:text-red-400 font-semibold cursor-pointer text-xs"
                        >
                          {" "}
                          <Trash2 className="w-4 h-4 inline-block mr-1" /> Xóa
                          tài liệu
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-muted">
                        {" "}
                        {new Date(mat.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>{" "}
      {/* Upload Material Modal */}{" "}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-backgroundlack/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-750 px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-extrabold text-DEFAULT">
                {" "}
                <Upload className="w-4 h-4 inline-block mr-1" /> Đăng Tải Học
                Liệu Học Phần
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-DEFAULT text-lg font-bold cursor-pointer"
              >
                {" "}
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {" "}
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tiêu đề tài liệu
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-DEFAULT focus:outline-none focus:border-indigo-500"
                  placeholder="Ví dụ: Slide bài giảng chương 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>{" "}
              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mô tả chi tiết
                </label>{" "}
                <textarea
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-DEFAULT focus:outline-none focus:border-indigo-500 min-h-[80px]"
                  placeholder="Nhập ghi chú hoặc yêu cầu của tài liệu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>{" "}
              {/* Type Select */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Phân loại học liệu
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-DEFAULT focus:outline-none focus:border-indigo-500 cursor-pointer"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="lecture">Lecture (Bài giảng)</option>
                  <option value="document">Document (Tài liệu học tập)</option>
                  <option value="assignment">Assignment (Bài tập lớn)</option>
                </select>
              </div>{" "}
              {/* Conditional Due Date input */}{" "}
              {type === "assignment" && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Hạn nộp bài tập lớn
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-DEFAULT focus:outline-none focus:border-indigo-500 cursor-pointer"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              )}{" "}
              {/* File Upload input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tệp tin tài liệu (Tối đa 50MB)
                  <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-lg bg-background/40">
                  <div className="space-y-1 text-center">
                    {" "}
                    <svg
                      className="mx-auto h-12 w-12 text-slate-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h20a4 4 0 004-4V20m-4-12L28 8m0 0v8h8m-8-8h-4a4 4 0 00-4 4v8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />{" "}
                    </svg>
                    <div className="flex text-xs text-slate-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-bold text-indigo-400 hover:text-indigo-350 focus-within:outline-none"
                      >
                        <span>Chọn tệp tin để tải lên</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Hỗ trợ các định dạng ngoại trừ tệp thực thi (.exe, .bat,
                      v.v.)
                    </p>{" "}
                    {file && (
                      <p className="text-xs text-teal-400 font-bold font-mono truncate max-w-xs mt-2">
                        {" "}
                        📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                        MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>{" "}
              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-650 hover:bg-slate-750 text-muted hover:text-DEFAULT rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {" "}
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg shadow-lg hover:shadow-indigo-500/15 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {" "}
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

export default CourseContentManagement;
