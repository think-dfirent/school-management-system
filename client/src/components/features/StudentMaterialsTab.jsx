import React, { useState, useEffect } from "react";
import { BookOpen, Calendar } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
const StudentMaterialsTab = ({ classId }) => {
  const token = useAuthStore((state) => state.token);

  const [materials, setMaterials] = useState([]);

  const [loading, setLoading] = useState(true);

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
        `http://localhost:5000/api/materials/student/${classId}`,
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

  const handleAction = async (materialId) => {
    try {
      // Exception 3.1: Call the check endpoint before opening the URL
      const res = await axios.get(
        `http://localhost:5000/api/materials/${materialId}/download`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data && res.data.fileUrl) {
        // Open file link in new window for download/preview
        window.open(res.data.fileUrl, '_blank');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Display exactly the backend's error message: "Khong the load materials luc nay. File khong ton tai hoac da bi delete!"
        showAlert(err.response.data.message || 'Không thể tải tài liệu lúc này. File không tồn tại hoặc đã bị xóa!', 'error');
        // Refresh list automatically to prune the dead item
        fetchMaterials();
      } else {
        showAlert("Lỗi khi tải file. Vui lòng thử lại!", "error");
      }
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const displayMaterials = (materials || []).filter(
    (item) => item.type !== "assignment" && item.type !== "Bài tập lớn",
  );

  return (
    <div className="space-y-6 relative">
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
      )}
      <div>
        <h3 className="text-base font-bold text-DEFAULT">
          Bài giảng &amp; Tài liệu Học tập
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          Danh sách các học liệu được giảng viên đăng tải phục vụ khóa học
        </p>
      </div>{" "}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs font-medium animate-pulse">
            Đang tải danh sách học liệu...
          </span>
        </div>
      ) : displayMaterials.length === 0 ? (
        <div className="bg-background/30 border border-border rounded-xl p-12 text-center">
          <div className="text-5xl mb-3">📂</div>{" "}
          <h4 className="text-sm font-bold text-muted">
            Không có bài giảng hoặc tài liệu nào
          </h4>
          <p className="text-xs text-muted mt-1">
            Giảng viên chưa đăng tải học liệu nào cho lớp học phần này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {" "}
          {displayMaterials.map((mat) => (
            <div
              key={mat._id}
              className="bg-background/40 border border-border hover:border-border p-5 rounded-xl transition duration-150 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-3xl select-none mt-0.5 flex-shrink-0">
                  {" "}
                  {mat.type === "lecture"
                    ? '<BookOpen className="w-4 h-4 inline-block mr-1" />'
                    : "📄"}
                </span>
                <div className="space-y-1 min-w-0">
                  {" "}
                  <h4
                    className="text-sm font-bold text-DEFAULT truncate leading-snug"
                    title={mat.title}
                  >
                    {mat.title}
                  </h4>
                  <p
                    className="text-xs text-muted line-clamp-2 leading-relaxed"
                    title={mat.description}
                  >
                    {mat.description || (
                      <span className="italic text-slate-500">
                        Chưa có mô tả
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                    <span>
                      📂 {mat.type === "lecture" ? "Bài giảng" : "Tài liệu"}
                    </span>
                    <span>•</span>
                    <span>
                      <Calendar className="w-4 h-4 inline-block mr-1" />{" "}
                      {formatShortDate(mat.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center flex-shrink-0">
                {" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAction(mat._id);
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-white rounded-lg text-xs font-bold shadow-md hover:shadow-teal-500/15 transition duration-150 text-center inline-block cursor-pointer"
                >
                  {" "}
                  Tải xuống{" "}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMaterialsTab;
