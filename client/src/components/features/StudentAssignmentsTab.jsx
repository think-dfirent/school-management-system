import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertTriangle, FileText, Clock, Download, Upload, Eye } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const StudentAssignmentsTab = ({ classId }) => {
  const token = useAuthStore((state) => state.token);

  // Initial States
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [submittingIds, setSubmittingIds] = useState({});
  const [downloadingIds, setDownloadingIds] = useState({});

  // Toast alert states (Hoisted to top to prevent "accessed before declaration" errors)
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

  const handleDownloadAssignmentFile = async (assignmentId) => {
    const key = `${assignmentId}-material`;
    if (downloadingIds[key]) return;
    setDownloadingIds((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await axios.get(
        `http://localhost:5000/api/materials/${assignmentId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data && res.data.fileUrl) {
        window.open(res.data.fileUrl, "_blank");
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Lỗi khi lấy liên kết tải đề bài!", "error");
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDownloadSubmissionFile = async (assignmentId, submissionId) => {
    const key = `${assignmentId}-submission`;
    if (downloadingIds[key]) return;
    setDownloadingIds((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await axios.get(
        `http://localhost:5000/api/materials/submission/${submissionId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data && res.data.fileUrl) {
        window.open(res.data.fileUrl, "_blank");
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Lỗi khi lấy liên kết tải bài làm!", "error");
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [key]: false }));
    }
  };

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/materials/student/${classId}/assignments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAssignments(res.data || []);
    } catch (err) {
      showAlert(err.response?.data?.message || "Lỗi khi tải danh sách bài tập lớn!", "error");
    } finally {
      setLoading(false);
    }
  }, [classId, token]);

  useEffect(() => {
    if (classId && token) {
      fetchAssignments();
    }
  }, [classId, token, fetchAssignments]);

  const handleFileChange = (assignmentId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadErrors((prev) => ({ ...prev, [assignmentId]: "" }));

    const isTooLarge = file.size > 50 * 1024 * 1024;
    const forbiddenExts = [
      ".exe",
      ".bat",
      ".cmd",
      ".sh",
      ".msi",
      ".com",
      ".vbs",
      ".scr",
    ];
    const fileName = file.name.toLowerCase();
    const hasForbiddenExt = forbiddenExts.some((ext) => fileName.endsWith(ext));

    if (isTooLarge || hasForbiddenExt) {
      setUploadErrors((prev) => ({
        ...prev,
        [assignmentId]:
          "Định dạng file không hợp lệ hoặc dung lượng vượt quá giới hạn 50MB. Vui lòng kiểm tra lại!",
      }));
      setSelectedFiles((prev) => ({ ...prev, [assignmentId]: null }));
      e.target.value = "";
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [assignmentId]: file }));
  };

  const handleSubmit = async (assignObj) => {
    const assignId = assignObj._id;
    const file = selectedFiles[assignId];

    if (!file) {
      showAlert("Vui lòng chọn tệp tin cần nộp!", "error");
      return;
    }

    if (assignObj.submission) {
      const confirmOverwrite = window.confirm(
        "Bạn đã nộp bài trước đó. Hành động này sẽ xóa và thay thế file cũ. Bạn có chắc chắn muốn tiếp tục?",
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    setSubmittingIds((prev) => ({ ...prev, [assignId]: true }));

    const formData = new FormData();
    formData.append("assignmentId", assignId);
    formData.append("file", file);

    try {
      await axios.post("http://localhost:5000/api/materials/submit", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      showAlert("Nộp bài thành công!", "success");
      setSelectedFiles((prev) => ({ ...prev, [assignId]: null }));
      fetchAssignments();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Có lỗi xảy ra khi nộp bài!",
        "error",
      );
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [assignId]: false }));
    }
  };

  const isPastDeadline = (dueDate) => {
    if (!dueDate) return false;
    // eslint-disable-next-line react-hooks/purity
    return Date.now() > new Date(dueDate).getTime();
  };

  const formatLongDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 relative text-DEFAULT">
      {/* Custom Toast Alert */}
      {alert.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center px-4 py-3 rounded-md shadow-2xl transition-all duration-300 transform translate-y-0 ${
            alert.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span className="mr-2">
            {alert.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          </span>
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      <div>
        <h3 className="text-base font-bold text-DEFAULT">
          Bài tập lớn học phần
        </h3>
        <p className="text-xs text-muted mt-0.5 font-medium">
          Xem yêu cầu, thời hạn nộp bài và quản lý bài nộp của bạn
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted text-xs font-medium animate-pulse">
            Đang tải danh sách bài tập lớn...
          </span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-400">
            Không có bài tập lớn nào
          </h4>
          <p className="text-xs text-muted mt-1">
            Giảng viên chưa phân công bài tập lớn nào cho lớp học phần này.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assign) => {
            const pastDeadline = isPastDeadline(assign.dueDate);
            const fileSelected = selectedFiles[assign._id];
            const uploadError = uploadErrors[assign._id];
            const submitting = submittingIds[assign._id];

            return (
              <div
                key={assign._id}
                className="bg-surface border border-border p-5 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm"
              >
                {/* Details column */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {assign.submission ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle size={10} className="mr-1" />
                        Đã nộp bài
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-primary border border-primary/20">
                        <AlertTriangle size={10} className="mr-1" />
                        Chưa nộp bài
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-muted font-mono flex items-center gap-1">
                      <Clock size={10} />
                      Hạn nộp: {formatLongDate(assign.dueDate)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-DEFAULT">
                    {assign.title}
                  </h4>
                  {assign.description && (
                    <p className="text-xs text-muted leading-relaxed max-w-2xl">
                      {assign.description}
                    </p>
                  )}

                  <div className="flex gap-4 text-[10px] font-mono text-muted pt-1">
                    <button
                      onClick={() => handleDownloadAssignmentFile(assign._id)}
                      className="text-primary hover:underline cursor-pointer flex items-center gap-1 focus:outline-none"
                    >
                      <Download size={12} />
                      {downloadingIds[`${assign._id}-material`]
                        ? "Đang tải..."
                        : "Đề bài đính kèm"}
                    </button>
                    {assign.submission && (
                      <button
                        onClick={() =>
                          handleDownloadSubmissionFile(
                            assign._id,
                            assign.submission._id,
                          )
                        }
                        className="text-primary hover:underline cursor-pointer flex items-center gap-1 focus:outline-none"
                      >
                        <Eye size={12} />
                        {downloadingIds[`${assign._id}-submission`]
                          ? "Đang tải..."
                          : `Xem bài làm đã nộp (${new Date(assign.submission.submittedAt).toLocaleDateString("vi-VN")})`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Form submit column */}
                <div className="w-full md:w-auto md:min-w-[260px] flex-shrink-0 space-y-2 bg-background/40 p-3 rounded-md border border-border">
                  {pastDeadline ? (
                    <div className="text-center py-2.5">
                      <span className="text-xs font-bold text-rose-500 block">
                        Đã quá hạn nộp bài!
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                        {assign.submission
                          ? "Nộp lại bài làm mới"
                          : "Tải lên bài làm (.pdf, .zip, v.v.)"}
                      </label>
                      <input
                        type="file"
                        disabled={submitting}
                        onChange={(e) => handleFileChange(assign._id, e)}
                        className="w-full text-xs text-muted file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border file:border-border file:text-[10px] file:font-bold file:bg-surface file:text-DEFAULT hover:file:bg-background file:cursor-pointer"
                      />
                      {uploadError && (
                        <p className="text-[10px] font-semibold text-rose-500 leading-tight">
                          {uploadError}
                        </p>
                      )}
                      {fileSelected && (
                        <p className="text-[10px] font-mono text-primary truncate max-w-[240px] flex items-center gap-1">
                          <CheckCircle size={10} />
                          Selected: {fileSelected.name}
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={!fileSelected || submitting}
                        onClick={() => handleSubmit(assign)}
                        className="w-full py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-md text-xs font-bold transition shadow-sm cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        <Upload size={12} />
                        {submitting
                          ? "Đang nộp bài..."
                          : assign.submission
                            ? "Nộp lại bài làm"
                            : "Nộp bài"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentsTab;
