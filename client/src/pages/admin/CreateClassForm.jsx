import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
const CreateClassForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const semesterIdParam = searchParams.get("semesterId");

  const token = useAuthStore((state) => state.token);

  // Dropdown list states
  const [subjects, setSubjects] = useState([]);

  const [lecturers, setLecturers] = useState([]);

  const [semesters, setSemesters] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Form inputs state
  const [formData, setFormData] = useState({
    classId: "",
    subject: "",
    instructor: "",
    semester: "",
    dayOfWeek: "2",
    startPeriod: "1",
    endPeriod: "3",
    room: "",
    maxStudents: "40",
  });

  // Custom Toast Alert State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // type: 'success' | 'error'
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 5000);
  };

  // Load data for dropdowns
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchDropdownData = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          "http://localhost:5000/api/classes/form-data",
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const { subjects, lecturers, semesters } = response.data;
        setSubjects(subjects);
        setLecturers(lecturers);
        setSemesters(semesters);

        // Find if any semester has semesterId matching semesterIdParam
        const targetSem = semesters.find(sem => sem.semesterId === semesterIdParam);
        const selectedSemId = targetSem ? targetSem._id : (semesters[0]?._id || '');

        setFormData(prev => ({
          ...prev,
          subject: prev.subject || (subjects[0]?._id || ''),
          instructor: prev.instructor || (lecturers[0]?._id || ''),
          semester: selectedSemId,
        }));
      } catch (err) {
        showToast(
          "Không thể kết nối với máy chủ để tải dữ liệu form!",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDropdownData();
  }, [token, navigate]);

  // Handle standard inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Client-side Validation
    const isFieldEmpty =
      !formData.classId.trim() ||
      !formData.subject ||
      !formData.instructor ||
      !formData.semester ||
      !formData.dayOfWeek ||
      !formData.startPeriod ||
      !formData.endPeriod ||
      !formData.room.trim() ||
      !formData.maxStudents;
    const start = parseInt(formData.startPeriod, 10);

    const end = parseInt(formData.endPeriod, 10);

    if (isFieldEmpty || isNaN(start) || isNaN(end) || start > end) {
      showToast(
        "Vui lòng nhập đầy đủ thông tin và kiểm tra lại lịch học!",
        "error",
      );
      return;
    }
    // Format payload to match server schedules array requirements
    const payload = {
      classId: formData.classId.trim().toUpperCase(),
      subject: formData.subject,
      instructor: formData.instructor,
      semester: formData.semester,
      room: formData.room.trim(),
      maxStudents: parseInt(formData.maxStudents, 10),
      schedules: [
        {
          dayOfWeek: parseInt(formData.dayOfWeek, 10),
          startPeriod: start,
          endPeriod: end,
        },
      ],
    };

    try {
      setSubmitting(true);

      const response = await axios.post(
        "http://localhost:5000/api/classes",
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showToast(response.data.message || "Mở lớp thành công", "success");

      // Redirect back to Class Management after short delay
      setTimeout(() => {
        navigate("/admin/classes");
      }, 1800);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Có lỗi xảy ra khi tạo lớp học phần!",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-DEFAULT font-sans relative overflow-hidden transition-colors duration-150">
      
      {/* Custom Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-md shadow-2xl border transition-all duration-300 transform translate-y-0 ${
            toast.type === "success" 
              ? "bg-surface border-emerald-500/30 text-emerald-400" 
              : "bg-surface border-rose-500/30 text-rose-400"
          }`}
        >
          <span className="font-bold text-lg">
            {toast.type === "success" ? "✓" : "⚠"}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
      <div className="bg-surface border border-border rounded-md shadow-lg w-full max-w-4xl p-8 relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-DEFAULT">
              Mở Lớp Học Phần Mới
            </h2>
            <p className="text-sm text-muted mt-1 mb-6">
              Vui lòng hoàn tất mẫu thông tin bên dưới để tổ chức lớp giảng dạy.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/classes")}
            className="bg-transparent border border-border text-muted hover:text-DEFAULT hover:bg-background/50 font-semibold py-1.5 px-4 rounded-md transition-colors cursor-pointer text-xs"
          >
            Quay lại
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted text-sm animate-pulse">
              Đang nạp cấu hình học kỳ, môn học và giảng viên...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: Class ID & Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                  Mã lớp học phần *
                </label>
                <input
                  type="text"
                  name="classId"
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono uppercase"
                  placeholder="Ví dụ: INT1340-01"
                  value={formData.classId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      classId: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                  Học kỳ *
                </label>
                <select
                  name="semester"
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  value={formData.semester}
                  onChange={handleInputChange}
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

            {/* Row 2: Subject & Instructor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                  Môn học *
                </label>
                <select
                  name="subject"
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  value={formData.subject}
                  onChange={handleInputChange}
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
                <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                  Giảng viên phụ trách *
                </label>
                <select
                  name="instructor"
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  value={formData.instructor}
                  onChange={handleInputChange}
                >
                  <option value="">-- Chọn Giảng viên --</option>
                  {lecturers.map((lect) => (
                    <option key={lect._id} value={lect._id}>
                      {lect.fullName} ({lect.userId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Schedule Details */}
            <div className="bg-background/50 border border-border rounded-md p-5 mt-2 space-y-4">
              <h4 className="text-xs font-bold uppercase text-muted tracking-widest pb-1 border-b border-border">
                Chi tiết Lịch học
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                    Thứ trong tuần *
                  </label>
                  <select
                    name="dayOfWeek"
                    required
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer text-sm"
                    value={formData.dayOfWeek}
                    onChange={handleInputChange}
                  >
                    <option value="2">Thứ 2</option>
                    <option value="3">Thứ 3</option>
                    <option value="4">Thứ 4</option>
                    <option value="5">Thứ 5</option>
                    <option value="6">Thứ 6</option>
                    <option value="7">Thứ 7</option>
                    <option value="8">Chủ Nhật</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                    Tiết học bắt đầu *
                  </label>
                  <input
                    type="number"
                    name="startPeriod"
                    required
                    min="1"
                    max="14"
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono"
                    value={formData.startPeriod}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                    Tiết học kết thúc *
                  </label>
                  <input
                    type="number"
                    name="endPeriod"
                    required
                    min="1"
                    max="14"
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono"
                    value={formData.endPeriod}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Room & Max Students */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                  Phòng học *
                </label>
                <input
                  type="text"
                  name="room"
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ví dụ: Phòng 302-A2"
                  value={formData.room}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                  Sĩ số sinh viên tối đa *
                </label>
                <input
                  type="number"
                  name="maxStudents"
                  required
                  min="1"
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  placeholder="40"
                  value={formData.maxStudents}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/admin/classes")}
                className="bg-transparent border border-border text-muted hover:text-DEFAULT hover:bg-background/50 font-semibold py-2.5 px-6 rounded-md transition-colors cursor-pointer text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-md transition-colors border-none cursor-pointer flex justify-center items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang lưu lớp học...
                  </>
                ) : (
                  "Mở Lớp Học Phần"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateClassForm;
