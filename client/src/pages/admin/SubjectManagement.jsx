import { useState, useEffect } from "react";
import { BookOpen, AlertTriangle, CheckCircle, X, MoreHorizontal, Edit3, Trash2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const SubjectManagement = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  // Initial States
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Alert states (Hoisted to the top)
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // Modal and Form States
  const [modal, setModal] = useState({ show: false, type: "add", data: null });
  const [formData, setFormData] = useState({
    subjectId: "",
    subjectName: "",
    credits: 3,
  });

  // Delete Confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    id: null,
    subjectId: "",
  });

  // Fetch subjects from API
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể tải danh sách môn học!",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSubjects();
  }, [token]);

  // Open Add/Edit Modal
  const openModal = (type, data = null) => {
    if (type === "edit" && data) {
      setFormData({
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        credits: data.credits,
      });
      setModal({ show: true, type: "edit", data });
    } else {
      setFormData({ subjectId: "", subjectName: "", credits: 3 });
      setModal({ show: true, type: "add", data: null });
    }
  };

  const closeModal = () => {
    setModal({ show: false, type: "add", data: null });
  };

  // Handle Form Submit (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.subjectId ||
      !formData.subjectId.trim() ||
      !formData.subjectName ||
      !formData.subjectName.trim() ||
      !formData.credits
    ) {
      showAlert("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }
    try {
      if (modal.type === "add") {
        const response = await axios.post(
          "http://localhost:5000/api/subjects",
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert(
          response.data.message || "Thêm môn học thành công!",
          "success",
        );
      } else {
        const response = await axios.put(
          `http://localhost:5000/api/subjects/${modal.data._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert(
          response.data.message || "Cập nhật môn học thành công!",
          "success",
        );
      }
      closeModal();
      fetchSubjects();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!",
        "error",
      );
    }
  };

  // Handle Delete Trigger
  const handleDeleteClick = (subject) => {
    setDeleteConfirm({
      show: true,
      id: subject._id,
      subjectId: subject.subjectId,
    });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/subjects/${deleteConfirm.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert(response.data.message || "Xóa môn học thành công!", "success");
      setDeleteConfirm({ show: false, id: null, subjectId: "" });
      fetchSubjects();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể xóa môn học!",
        "error",
      );
      setDeleteConfirm({ show: false, id: null, subjectId: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-DEFAULT font-sans p-6 relative transition-colors duration-150">
      
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

      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
            Quản Lý Môn Học
          </h1>
          <p className="text-muted mt-1 text-sm">
            Hệ thống Quản lý Đào tạo học phần & tín chỉ học tập
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openModal("add")}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen size={16} />
            Thêm Môn Học
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-7xl mx-auto bg-surface border border-border rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang tải danh sách môn học...
            </span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-16 text-center">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-450">
              Chưa có môn học nào
            </h3>
            <p className="text-muted mt-1 text-sm max-w-md mx-auto">
              Vui lòng bấm nút "+ Thêm Môn Học" ở góc trên bên phải để tạo mới môn học đầu tiên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Mã môn học</th>
                  <th className="px-6 py-4">Tên môn học</th>
                  <th className="px-6 py-4">Số tín chỉ</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {subjects.map((subj) => (
                  <tr
                    key={subj._id}
                    className="hover:bg-background/80 transition duration-150"
                  >
                    <td className="py-3 px-4 align-middle font-mono text-DEFAULT font-semibold">
                      {subj.subjectId}
                    </td>
                    <td className="py-3 px-4 align-middle font-medium text-DEFAULT">
                      {subj.subjectName}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap border bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20">
                        {subj.credits} tín chỉ
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle text-right relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === subj.subjectId ? null : subj.subjectId)}
                        className="p-2 rounded-md text-muted hover:text-DEFAULT hover:bg-background transition-colors focus:outline-none cursor-pointer"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {openDropdownId === subj.subjectId && (
                        <>
                          {/* Click outside backdrop */}
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={() => setOpenDropdownId(null)}
                          />
                          <div className="absolute right-4 mt-1 w-32 bg-surface border border-border rounded-md shadow-xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              onClick={() => {
                                openModal("edit", subj);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-muted hover:text-DEFAULT hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Sửa
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteClick(subj);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Xóa
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Subject Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-md p-6 transform scale-100 transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-DEFAULT">
                {modal.type === "add" ? "Thêm Môn Học Mới" : "Cập Nhật Môn Học"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-DEFAULT font-bold transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Mã môn học
                </label>
                <input
                  type="text"
                  required
                  disabled={modal.type === "edit"}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm disabled:opacity-50"
                  placeholder="Ví dụ: INT1340"
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subjectId: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Tên môn học
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Ví dụ: Nhập môn Công nghệ thông tin"
                  value={formData.subjectName}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Số tín chỉ
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  value={formData.credits}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credits: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-DEFAULT bg-surface rounded-md border border-border transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer"
                >
                  {modal.type === "add" ? "Thêm mới" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-sm p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-DEFAULT">
                Xác Nhận Xóa Môn Học
              </h3>
              <p className="text-sm text-muted mt-2 font-medium">
                Bạn có chắc chắn muốn xóa môn học <span className="font-mono font-bold text-DEFAULT">{deleteConfirm.subjectId}</span> không?
              </p>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() =>
                  setDeleteConfirm({ show: false, id: null, subjectId: "" })
                }
                className="px-5 py-2 text-sm font-semibold text-slate-400 hover:text-DEFAULT bg-surface rounded-md border border-border transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
