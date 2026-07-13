import { useState, useEffect } from "react";
import { MapPin, School, AlertTriangle, CheckCircle, X, Edit3, Trash2, Calendar, RefreshCw, MoreHorizontal } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const ClassManagement = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);

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

  // Modal and Delete Confirm states
  const [modal, setModal] = useState({ show: false, type: "add", data: null });
  const [schedules, setSchedules] = useState([
    { dayOfWeek: 2, startPeriod: 1, endPeriod: 3 },
  ]);

  const [formData, setFormData] = useState({
    classId: "",
    subject: "",
    instructor: "",
    semester: "",
    startDate: "",
    endDate: "",
    room: "",
    maxStudents: 40,
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    id: null,
    classId: "",
  });

  const formatDateForInput = (dStr) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch drop-down data and class sections list
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subjects
      const subjRes = await axios.get("http://localhost:5000/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(subjRes.data);

      // Fetch instructors
      const instRes = await axios.get("http://localhost:5000/api/users", {
        params: { role: "instructor", limit: 1000 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setInstructors(instRes.data.users || []);

      // Fetch semesters
      const semRes = await axios.get("http://localhost:5000/api/semesters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSemesters(semRes.data);

      // Fetch rooms list
      const roomsRes = await axios.get("http://localhost:5000/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(roomsRes.data);

      // Fetch classes list
      const classRes = await axios.get("http://localhost:5000/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(classRes.data);
    } catch (err) {
      showAlert(err.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu từ server!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token]);

  // Form inputs change
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Dynamic Schedules handlers
  const handleScheduleChange = (index, field, value) => {
    const updated = [...schedules];
    if (field === "room") {
      updated[index][field] = value;
    } else {
      updated[index][field] = parseInt(value) || value;
    }
    setSchedules(updated);
  };

  const addScheduleRow = () => {
    setSchedules([
      ...schedules,
      { dayOfWeek: 2, startPeriod: 1, endPeriod: 3, room: rooms[0]?._id || "" },
    ]);
  };

  const removeScheduleRow = (index) => {
    if (schedules.length === 1) {
      showAlert("Lớp học phần phải có ít nhất một lịch học cụ thể!", "error");
      return;
    }
    setSchedules(schedules.filter((_, idx) => idx !== index));
  };

  // Open Add / Edit Modal
  const openModal = (type, data = null) => {
    if (type === "edit" && data) {
      setFormData({
        classId: data.classId || "",
        subject: data.subject?._id || "",
        instructor: data.instructor?._id || "",
        semester: data.semester?._id || "",
        startDate: formatDateForInput(data.startDate),
        endDate: formatDateForInput(data.endDate),
        room: data.room || "",
        maxStudents: data.maxStudents || 40,
      });

      const mappedSchedules = (data.schedules || []).map((s) => ({
        ...s,
        room: s.room && typeof s.room === "object" ? s.room._id : s.room,
      }));
      setSchedules(
        mappedSchedules.length
          ? mappedSchedules
          : [
              {
                dayOfWeek: 2,
                startPeriod: 1,
                endPeriod: 3,
                room: rooms[0]?._id || "",
              },
            ],
      );
      setModal({ show: true, type: "edit", data });
    } else {
      setFormData({
        classId: "",
        subject: subjects[0]?._id || "",
        instructor: instructors[0]?._id || "",
        semester: semesters[0]?._id || "",
        startDate: "",
        endDate: "",
        room: "",
        maxStudents: 40,
      });
      setSchedules([
        {
          dayOfWeek: 2,
          startPeriod: 1,
          endPeriod: 3,
          room: rooms[0]?._id || "",
        },
      ]);
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
      !formData.subject ||
      !formData.instructor ||
      !formData.semester ||
      !formData.startDate ||
      !formData.endDate
    ) {
      showAlert(
        "Vui lòng điền đầy đủ tất cả thông tin và chọn các giá trị phù hợp!",
        "error",
      );
      return;
    }

    for (const s of schedules) {
      if (!s.room || !s.room.trim()) {
        showAlert(
          "Mỗi buổi học của lịch học phải được xếp phòng cụ thể!",
          "error",
        );
        return;
      }
      if (s.startPeriod > s.endPeriod) {
        showAlert("Tiết bắt đầu không thể lớn hơn tiết kết thúc!", "error");
        return;
      }
    }
    const payload = { ...formData, room: schedules[0]?.room || "", schedules };

    try {
      if (modal.type === "add") {
        const response = await axios.post(
          "http://localhost:5000/api/classes",
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert(
          response.data.message || "Tạo lớp học phần thành công!",
          "success",
        );
      } else {
        const response = await axios.put(
          `http://localhost:5000/api/classes/${modal.data._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        showAlert(
          response.data.message || "Cập nhật lớp học phần thành công!",
          "success",
        );
      }
      closeModal();
      fetchData();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu lớp học phần!",
        "error",
      );
    }
  };

  // Handle Delete Trigger
  const handleDeleteClick = (cls) => {
    setDeleteConfirm({ show: true, id: cls._id, classId: cls.classId });
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/classes/${deleteConfirm.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert(
        response.data.message || "Xóa lớp học phần thành công!",
        "success",
      );
      setDeleteConfirm({ show: false, id: null, classId: "" });
      fetchData();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Không thể xóa lớp học phần!",
        "error",
      );
      setDeleteConfirm({ show: false, id: null, classId: "" });
    }
  };

  // Helper: Format schedule output text
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
            Quản Lý Lớp Học Phần
          </h1>
          <p className="text-muted mt-1 text-sm">
            Quản lý mở các lớp học phần, phòng học và xếp thời khóa biểu giảng dạy
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/classes/create")}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <School size={16} />
            Mở Lớp Học Phần
          </button>
        </div>
      </div>

      {/* Classes Data Table Card */}
      <div className="max-w-7xl mx-auto bg-surface border border-border rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang tải danh sách lớp học phần...
            </span>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-16 text-center">
            <School className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">
              Chưa mở lớp học phần nào
            </h3>
            <p className="text-muted mt-1 text-sm max-w-md mx-auto">
              Vui lòng chọn "+ Mở Lớp Học Phần" để lập kế hoạch giảng dạy môn học mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Mã lớp HP</th>
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Giảng viên</th>
                  <th className="px-6 py-4">Học kỳ</th>
                  <th className="px-6 py-4">Lịch học / Phòng</th>
                  <th className="px-6 py-4">Sĩ số</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {classes.map((cls) => (
                  <tr
                    key={cls._id}
                    className="hover:bg-slate-550/10 dark:hover:bg-white/5 transition duration-150"
                  >
                    <td className="py-3 px-4 align-middle font-mono text-DEFAULT font-semibold">
                      {cls.classId}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="block font-semibold text-DEFAULT">
                        {cls.subject?.subjectName || "-"}
                      </span>
                      <span className="text-xs text-muted font-mono">
                        ID: {cls.subject?.subjectId || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="block font-medium">
                        {cls.instructor?.fullName || "-"}
                      </span>
                      <span className="text-xs text-muted font-mono">
                        MS: {cls.instructor?.userId || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle text-muted text-xs">
                      {cls.semester?.semesterName || "-"}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="block text-DEFAULT text-xs font-semibold">
                        {formatSchedule(cls.schedules)}
                      </span>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 w-max">
                        <MapPin size={12} />
                        {cls.room || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="font-mono text-DEFAULT">
                        {cls.currentStudents} / {cls.maxStudents}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle text-right relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === cls.classId ? null : cls.classId)}
                        className="p-2 rounded-md text-muted hover:text-DEFAULT hover:bg-background transition-colors focus:outline-none cursor-pointer"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {openDropdownId === cls.classId && (
                        <>
                          {/* Click outside backdrop */}
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={() => setOpenDropdownId(null)}
                          />
                          <div className="absolute right-4 mt-1 w-32 bg-surface border border-border rounded-md shadow-xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              onClick={() => {
                                openModal("edit", cls);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-muted hover:text-DEFAULT hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Sửa
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteClick(cls);
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

      {/* Add / Edit Class Modal dialog */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 overflow-y-auto">
          <div className="bg-surface border border-border rounded-md shadow-sm w-full max-w-lg p-6 my-8">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-DEFAULT">
                {modal.type === "add" ? "Mở Lớp Học Phần Mới" : "Cập Nhật Lớp Học Phần"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-DEFAULT font-bold transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Mã lớp học phần *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modal.type === "edit"}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 font-mono text-sm"
                    placeholder="Ví dụ: INT1340-01"
                    name="classId"
                    value={formData.classId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        classId: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Học kỳ áp dụng *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    <option value="">-- Chọn Học kỳ --</option>
                    {semesters.map((sem) => (
                      <option key={sem._id} value={sem._id}>
                        {sem.semesterName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Môn học *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    <option value="">-- Chọn Môn học --</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.subjectName} ({sub.subjectId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Giảng viên phụ trách *
                  </label>
                  <select
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    <option value="">-- Chọn Giảng viên --</option>
                    {instructors.map((ins) => (
                      <option key={ins._id} value={ins._id}>
                        {ins.fullName} (MS: {ins.userId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Sĩ số tối đa *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="200"
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxStudents: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Dynamic Schedule List */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">
                    Thời khóa biểu chi tiết *
                  </label>
                  <button
                    type="button"
                    onClick={addScheduleRow}
                    className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    + Thêm buổi học
                  </button>
                </div>
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {schedules.map((sched, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center bg-background border border-border p-2.5 rounded-md flex-wrap md:flex-nowrap"
                    >
                      <div className="flex-1">
                        <label className="block text-[10px] text-muted font-medium mb-0.5">
                          Thứ
                        </label>
                        <select
                          value={sched.dayOfWeek}
                          onChange={(e) =>
                            handleScheduleChange(idx, "dayOfWeek", e.target.value)
                          }
                          className="w-full text-xs p-1.5 bg-surface border border-border rounded text-DEFAULT focus:outline-none"
                        >
                          <option value={2}>Thứ 2</option>
                          <option value={3}>Thứ 3</option>
                          <option value={4}>Thứ 4</option>
                          <option value={5}>Thứ 5</option>
                          <option value={6}>Thứ 6</option>
                          <option value={7}>Thứ 7</option>
                          <option value={8}>Chủ Nhật</option>
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] text-muted font-medium mb-0.5">
                          Tiết BĐ
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="14"
                          value={sched.startPeriod}
                          onChange={(e) =>
                            handleScheduleChange(idx, "startPeriod", e.target.value)
                          }
                          className="w-full text-xs p-1.5 bg-surface border border-border rounded text-DEFAULT focus:outline-none font-mono"
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] text-muted font-medium mb-0.5">
                          Tiết KT
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="14"
                          value={sched.endPeriod}
                          onChange={(e) =>
                            handleScheduleChange(idx, "endPeriod", e.target.value)
                          }
                          className="w-full text-xs p-1.5 bg-surface border border-border rounded text-DEFAULT focus:outline-none font-mono"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[10px] text-muted font-medium mb-0.5">
                          Phòng học
                        </label>
                        <select
                          value={sched.room || ""}
                          onChange={(e) =>
                            handleScheduleChange(idx, "room", e.target.value)
                          }
                          className="w-full text-xs p-1.5 bg-surface border border-border rounded text-DEFAULT focus:outline-none"
                        >
                          <option value="">-- Chọn phòng --</option>
                          {rooms.map((rm) => (
                            <option key={rm._id} value={rm._id}>
                              {rm.roomId}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeScheduleRow(idx)}
                        className="text-xs text-primary hover:text-primary-hover font-bold self-end mb-1 px-2 py-1 hover:bg-primary/10 rounded cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
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
                Xóa Lớp Học Phần
              </h3>
              <p className="text-sm text-muted mt-2">
                Bạn có chắc chắn muốn xóa lớp học phần{" "}
                <span className="font-mono font-bold text-DEFAULT">
                  {deleteConfirm.classId}
                </span>{" "}
                không? Hành động này sẽ gỡ lớp vĩnh viễn khỏi danh sách giảng dạy.
              </p>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() =>
                  setDeleteConfirm({ show: false, id: null, classId: "" })
                }
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-DEFAULT bg-surface rounded-md border border-border transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
