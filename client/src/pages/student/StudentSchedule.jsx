import React, { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, Calendar, BookOpen, Clock, Settings } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

// Dynamic Chevron SVGs to keep dependencies clean and happy
const ChevronLeft = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRight = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const MOCK_SEMESTERS = [
  {
    _id: "hk1-2526",
    semesterName: "Học kỳ I năm học 2025-2026",
    startDate: new Date("2025-08-11"),
    endDate: new Date("2026-01-18"),
    isActive: false,
  },
  {
    _id: "hk2-2526",
    semesterName: "Học kỳ II năm học 2025-2026",
    startDate: new Date("2026-02-02"),
    endDate: new Date("2026-06-14"),
    isActive: true,
  },
];

const periodStartTimes = {
  1: "07:00",
  2: "07:55",
  3: "09:00",
  4: "09:55",
  5: "10:50",
  6: "12:30",
  7: "13:25",
  8: "14:30",
  9: "15:25",
  10: "16:20",
};

const periodEndTimes = {
  1: "07:45",
  2: "08:40",
  3: "09:45",
  4: "10:40",
  5: "11:35",
  6: "13:15",
  7: "14:10",
  8: "15:15",
  9: "16:10",
  10: "17:05",
};

const getBlockTime = (startPeriod, endPeriod) => {
  const start = periodStartTimes[startPeriod] || `Tiết ${startPeriod}`;
  const end = periodEndTimes[endPeriod] || `Tiết ${endPeriod}`;
  return `${start} - ${end}`;
};

const StudentSchedule = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // Schedule state
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorAlert, setErrorAlert] = useState("");

  // Semesters & Weeks states
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);

  // Helper to generate weeks between startDate and endDate
  const generateWeeks = (startDt, endDt) => {
    if (!startDt || !endDt) return [];

    const start = new Date(startDt);
    const end = new Date(endDt);

    // Align to Monday of start date week
    const startDay = start.getDay();
    const startDiff = start.getDate() - startDay + (startDay === 0 ? -6 : 1);
    const firstMonday = new Date(start.setDate(startDiff));
    firstMonday.setHours(0, 0, 0, 0);

    const weeks = [];
    let currentMonday = new Date(firstMonday);
    let weekNum = 1;

    while (currentMonday <= end) {
      const monday = new Date(currentMonday);
      const sunday = new Date(currentMonday);
      sunday.setDate(currentMonday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const formatLabelDate = (d) => {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const label = `Tuần ${weekNum} [từ ngày ${formatLabelDate(monday)} đến ngày ${formatLabelDate(sunday)}]`;
      weeks.push({ weekNum, mondayDate: monday, sundayDate: sunday, label });
      currentMonday.setDate(currentMonday.getDate() + 7);
      weekNum++;
    }
    return weeks;
  };

  const formatDateLabel = (date) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  const getWeekDates = (start) => {
    if (!start) return [];
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Hook 1: Fetch semesters from API on mount, fallback to MOCK_SEMESTERS if empty or failing
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/semesters", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const semData = res.data || [];
        if (semData.length > 0) {
          setSemesters(semData);
          const active = semData.find((s) => s.isActive);
          setSelectedSemester(active ? active._id : semData[0]._id);
        } else {
          setSemesters(MOCK_SEMEES || MOCK_SEMESTERS);
          setSelectedSemester(MOCK_SEMESTERS[1]._id);
        }
      } catch (err) {
        console.error("Error fetching semesters, falling back to mock data:", err);
        setSemesters(MOCK_SEMESTERS);
        setSelectedSemester(MOCK_SEMESTERS[1]._id);
      }
    };

    if (token) {
      fetchSemesters();
    }
  }, [token]);

  // Hook 2: Generate weeks and set starting week whenever selected semester changes
  useEffect(() => {
    if (!selectedSemester || semesters.length === 0) return;
    const sem = semesters.find((s) => s._id === selectedSemester);
    if (sem) {
      const weeks = generateWeeks(sem.startDate, sem.endDate);
      setAvailableWeeks(weeks);

      // Default to current week if today is in range, else default to week 1
      const today = new Date();
      let defaultWeek = weeks[0];
      for (const w of weeks) {
        if (today >= w.mondayDate && today <= w.sundayDate) {
          defaultWeek = w;
          break;
        }
      }
      if (defaultWeek) {
        setCurrentWeekStart(defaultWeek.mondayDate);
      }
    }
  }, [selectedSemester, semesters]);

  // Fetch personal schedule from API
  const fetchMySchedule = async () => {
    setLoading(true);
    setErrorAlert("");
    try {
      const response = await axios.get(
        "http://localhost:5000/api/schedules/my-schedule",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setClasses(response.data || []);
    } catch (err) {
      setErrorAlert(
        err.response?.data?.message || "Lỗi kết nối dữ liệu. Vui lòng thử lại sau!",
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
    fetchMySchedule();
  }, [token]);

  const handlePreviousWeek = () => {
    if (!currentWeekStart || availableWeeks.length === 0) return;
    const currentIdx = availableWeeks.findIndex(
      (w) => w.mondayDate.getTime() === new Date(currentWeekStart).getTime(),
    );
    if (currentIdx > 0) {
      setCurrentWeekStart(availableWeeks[currentIdx - 1].mondayDate);
    }
  };

  const handleNextWeek = () => {
    if (!currentWeekStart || availableWeeks.length === 0) return;
    const currentIdx = availableWeeks.findIndex(
      (w) => w.mondayDate.getTime() === new Date(currentWeekStart).getTime(),
    );
    if (currentIdx !== -1 && currentIdx < availableWeeks.length - 1) {
      setCurrentWeekStart(availableWeeks[currentIdx + 1].mondayDate);
    }
  };

  // Filter classes to match the selected semester
  const semesterClasses = (classes || []).filter((cls) => {
    if (!selectedSemester) return true;
    const selectedSemObj = semesters.find((s) => s._id === selectedSemester);
    if (!selectedSemObj) return true;
    const semId = typeof cls.semester === "object" ? cls.semester?._id : cls.semester;
    const semName = typeof cls.semester === "object" ? cls.semester?.semesterName : "";
    return semId === selectedSemester || (semName && semName === selectedSemObj.semesterName);
  });

  // Parse class items into schedule blocks
  const scheduleBlocks = [];
  semesterClasses.forEach((cls) => {
    let isActiveThisWeek = true;
    if (cls.startDate && cls.endDate && currentWeekStart) {
      const start = new Date(cls.startDate);
      const end = new Date(cls.endDate);
      const weekStart = new Date(currentWeekStart);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      isActiveThisWeek = start <= weekEnd && end >= weekStart;
    }
    if (isActiveThisWeek && cls.schedules) {
      cls.schedules.forEach((s) => {
        scheduleBlocks.push({
          classId: cls.classId,
          subjectName: cls.subject?.subjectName || "N/A",
          subjectId: cls.subject?.subjectId || "",
          room: cls.room || (s.room ? s.room.roomId || s.room : "N/A"),
          dayOfWeek: s.dayOfWeek,
          startPeriod: s.startPeriod,
          endPeriod: s.endPeriod,
        });
      });
    }
  });

  const weekDates = getWeekDates(currentWeekStart);
  const weekDays =
    weekDates.length === 7
      ? [
          { dayName: "Thứ 2", dateString: formatDateLabel(weekDates[0]) },
          { dayName: "Thứ 3", dateString: formatDateLabel(weekDates[1]) },
          { dayName: "Thứ 4", dateString: formatDateLabel(weekDates[2]) },
          { dayName: "Thứ 5", dateString: formatDateLabel(weekDates[3]) },
          { dayName: "Thứ 6", dateString: formatDateLabel(weekDates[4]) },
          { dayName: "Thứ 7", dateString: formatDateLabel(weekDates[5]) },
          { dayName: "Chủ Nhật", dateString: formatDateLabel(weekDates[6]) },
        ]
      : [];

  if (!selectedSemester || !currentWeekStart || !weekDays || weekDays.length === 0) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-12">
        <div className="flex flex-col items-center justify-center p-24 bg-surface border border-border rounded-md shadow-sm w-full max-w-7xl gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted font-medium animate-pulse">
            Đang tải dữ liệu thời khóa biểu...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-background text-DEFAULT transition-colors duration-150">
      
      {/* Timetable Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
              Thời Khóa Biểu Cá Nhân
            </h1>
            <p className="text-muted mt-1 text-sm">
              Tra cứu thời khóa biểu học tập theo từng tuần học trong học kỳ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/student/registration")}
              className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition duration-150 cursor-pointer flex items-center gap-1 border-none"
            >
              <BookOpen size={12} />
              Đăng ký tín chỉ
            </button>
            <button
              onClick={fetchMySchedule}
              className="px-3 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-surface hover:bg-background border border-border rounded-md transition duration-150 cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Cập nhật
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 bg-surface border border-border p-4 rounded-md shadow-sm">
          {/* Semester Select */}
          <div className="flex flex-col gap-1.5 flex-1 sm:max-w-xs">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">
              Học Kỳ
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-background border border-border text-DEFAULT rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-full"
            >
              {(semesters || []).length === 0 && (
                <option value="">Đang tải học kỳ...</option>
              )}
              {(semesters || []).map((sem) => (
                <option key={sem._id} value={sem._id}>
                  {sem.semesterName}
                </option>
              ))}
            </select>
          </div>

          {/* Week Select */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">
              Tuần Học
            </label>
            <select
              value={currentWeekStart ? new Date(currentWeekStart).toISOString() : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setCurrentWeekStart(new Date(val));
                }
              }}
              className="bg-background border border-border text-DEFAULT rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-full"
            >
              {(availableWeeks || []).length === 0 && (
                <option value="">Đang tải tuần học...</option>
              )}
              {(availableWeeks || []).map((w) => (
                <option key={w.weekNum} value={w.mondayDate.toISOString()}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error alert toast */}
        {errorAlert && (
          <div className="p-4 rounded-md bg-rose-500/10 border border-primary/25 text-sm text-primary font-semibold flex items-center gap-1.5">
            <AlertTriangle size={16} />
            {errorAlert}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3 bg-surface border border-border rounded-md">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium animate-pulse">
              Đang nạp thời khóa biểu...
            </span>
          </div>
        ) : (
          /* Dynamic Timetable Visual Grid */
          <div className="w-full overflow-x-auto bg-surface border border-border rounded-md p-5 shadow-sm">
            <div className="min-w-[950px] grid grid-cols-[80px_repeat(7,minmax(0,1fr))_80px] grid-rows-[40px_repeat(10,96px)_40px] border-t border-l border-border mt-4 bg-background rounded-md relative overflow-hidden">
              
              {/* --- DONG 1: HEADER --- */}
              {/* Cot 1: Nut previous */}
              <div className="border-b border-r border-border p-2 flex items-center justify-center bg-surface">
                <button
                  onClick={handlePreviousWeek}
                  className="p-1 hover:bg-background rounded cursor-pointer text-muted hover:text-DEFAULT transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              {/* Cot 2-8: Cac date */}
              {(weekDays || []).map((day, index) => (
                <div
                  key={index}
                  className="border-b border-r border-border p-2 text-center bg-surface flex flex-col items-center justify-center"
                >
                  <span className="text-xs font-bold text-muted uppercase">{day.dayName}</span>
                  <span className="text-xs text-muted">({day.dateString})</span>
                </div>
              ))}

              {/* Cot 9: Nut next */}
              <div className="border-b border-r border-border p-2 flex items-center justify-center bg-surface">
                <button
                  onClick={handleNextWeek}
                  className="p-1 hover:bg-background rounded cursor-pointer text-muted hover:text-DEFAULT transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* --- DONG 2 DEN 11: BACKGROUND GRID VA TIMELINE --- */}
              {Array.from({ length: 10 }).map((_, rowIndex) => {
                const period = rowIndex + 1;
                return (
                  <React.Fragment key={`row-${period}`}>
                    {/* Cot 1: Truc time TRAI */}
                    <div className="border-b border-r border-border p-2 flex items-center justify-center bg-surface/50 h-24">
                      <span className="text-xs font-semibold text-muted">Tiết {period}</span>
                    </div>

                    {/* Cot 2-8: O TRONG (KHONG CO TEXT) */}
                    {Array.from({ length: 7 }).map((_, colIndex) => (
                      <div
                        key={`empty-${period}-${colIndex}`}
                        className="border-b border-r border-border h-24"
                      ></div>
                    ))}

                    {/* Cot 9: Truc time PHAI */}
                    <div className="border-b border-r border-border p-2 flex items-center justify-center bg-surface/50 h-24">
                      <span className="text-xs font-semibold text-muted">Tiết {period}</span>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* --- DONG CUOI: FOOTER --- */}
              {/* Cot 1: Nut previous */}
              <div className="border-t border-r border-border p-2 flex items-center justify-center bg-surface">
                <button
                  onClick={handlePreviousWeek}
                  className="p-1 hover:bg-background rounded cursor-pointer text-muted hover:text-DEFAULT transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              {/* Cot 2-8: Cac date */}
              {(weekDays || []).map((day, index) => (
                <div
                  key={index}
                  className="border-t border-r border-border p-2 text-center bg-surface flex flex-col items-center justify-center"
                >
                  <span className="text-xs font-bold text-muted uppercase">{day.dayName}</span>
                  <span className="text-xs text-muted">({day.dateString})</span>
                </div>
              ))}

              {/* Cot 9: Nut next */}
              <div className="border-t border-r border-border p-2 flex items-center justify-center bg-surface">
                <button
                  onClick={handleNextWeek}
                  className="p-1 hover:bg-background rounded cursor-pointer text-muted hover:text-DEFAULT transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* --- OVERLAY THE subject --- */}
              {(scheduleBlocks || []).map((block, idx) => {
                if (block.dayOfWeek < 2 || block.dayOfWeek > 8) return null;
                const colIndex = block.dayOfWeek;
                const rowIndex = block.startPeriod;
                const duration = block.endPeriod - block.startPeriod + 1;
                return (
                  <div
                    key={idx}
                    onClick={() => navigate(`/student/classes/${block.classId}`)}
                    className="absolute z-20 bg-primary/10 border-l-4 border-primary rounded-r-md rounded-l-sm p-2 shadow-sm transition-all hover:bg-primary/20 hover:shadow-md cursor-pointer flex flex-col items-start gap-1 overflow-hidden"
                    style={{
                      gridColumn: `${colIndex} / span 1`,
                      gridRow: `${rowIndex + 1} / span ${duration}`,
                      width: "calc(100% - 8px)",
                      height: "calc(100% - 8px)",
                      margin: "4px",
                    }}
                    title="Nhấp để xem không gian lớp học"
                  >
                    <h4 className="text-xs font-bold leading-tight uppercase text-left line-clamp-2 w-full">
                      {block.subjectName} ({block.subjectId})
                    </h4>
                    <p className="text-[10px] text-muted font-mono mt-1 text-left w-full">
                      Phòng: {block.room}
                    </p>
                    <p className="text-[10px] text-muted font-mono mt-1 text-left w-full flex items-center gap-1">
                      <Clock size={10} />
                      {getBlockTime(block.startPeriod, block.endPeriod)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSchedule;