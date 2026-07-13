import { useState, useEffect } from "react";
import { Calendar, Download, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import * as XLSX from "xlsx";

const StudentTuition = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [semesters, setSemesters] = useState([]);
  const [grandTotal, setGrandTotal] = useState({
    grossTuition: 0,
    paidAmount: 0,
    debtAmount: 0,
  });
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [loading, setLoading] = useState(true);

  // Toast alert state (Hoisted to top)
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

  // Fetch tuition data on mount
  const fetchTuitionData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/tuition/my-tuition",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSemesters(response.data.semesters || []);
      setGrandTotal(
        response.data.grandTotal || {
          grossTuition: 0,
          paidAmount: 0,
          debtAmount: 0,
        },
      );
    } catch {
      showAlert("Không thể tải thông tin học phí cá nhân!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTuitionData();
  }, [token]);

  // Format numbers to standard VND Currency output
  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Process rows based on semester filter
  const getFilteredRows = () => {
    let rows = [];
    semesters.forEach((sem) => {
      if (selectedSemester === "all" || sem.semesterId === selectedSemester) {
        sem.classes.forEach((cls) => {
          rows.push({
            semesterName: sem.semesterName,
            classId: cls.classId,
            subjectId: cls.subjectId,
            subjectName: cls.subjectName,
            credits: cls.credits,
            fee: cls.fee,
          });
        });
      }
    });
    return rows;
  };

  // Excel Export implementation
  const handleExportExcel = () => {
    try {
      const filteredRows = getFilteredRows();

      if (filteredRows.length === 0) {
        showAlert("Không có dữ liệu học phí để xuất file!", "error");
        return;
      }

      // Convert data to Excel rows array
      const worksheetData = filteredRows.map((r) => ({
        "Học kỳ": r.semesterName,
        "Mã lớp HP": r.classId,
        "Mã môn học": r.subjectId,
        "Tên môn học": r.subjectName,
        "Số tín chỉ": r.credits,
        "Học phí phải thu (VNĐ)": r.fee,
      }));

      // Add sum summaries rows
      worksheetData.push({});
      worksheetData.push({
        "Tên môn học": "TỔNG CỘNG HỌC PHÍ PHẢI THU:",
        "Số tín chỉ": filteredRows.reduce((sum, r) => sum + r.credits, 0),
        "Học phí phải thu (VNĐ)": filteredRows.reduce((sum, r) => sum + r.fee, 0),
      });

      // Create workbook and write sheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Học Phí");

      // Generate blob download file
      XLSX.writeFile(workbook, `HocPhi_${currentUser?.userId || "SinhVien"}.xlsx`);
      showAlert("Xuất file Excel học phí thành công!", "success");
    } catch {
      showAlert("Vui lòng cấp quyền tải xuống cho trình duyệt để xuất file.", "error");
    }
  };

  const filteredRows = getFilteredRows();

  // Summing for active selected filter views
  const getActiveSums = () => {
    if (selectedSemester === "all") {
      return grandTotal;
    }
    const activeSemObj = semesters.find(
      (s) => s.semesterId === selectedSemester,
    );

    if (activeSemObj) {
      return {
        grossTuition: activeSemObj.grossTuition,
        paidAmount: activeSemObj.paidAmount,
        debtAmount: activeSemObj.debtAmount,
      };
    }
    return { grossTuition: 0, paidAmount: 0, debtAmount: 0 };
  };

  const activeTotals = getActiveSums();

  return (
    <div className="flex-1 w-full flex flex-col bg-background text-DEFAULT transition-colors duration-150">
      
      {/* Toast Alerts */}
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

      {/* Main Content Dashboard */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-DEFAULT">
              Hóa Đơn Học Phí
            </h1>
            <p className="text-muted mt-1 text-sm">
              Xem thông tin học phí phải nộp, số tiền đã hoàn thành giao dịch và công nợ tồn đọng theo từng học kỳ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Semester filter selection */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 text-xs bg-surface border border-border rounded-md text-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả các học kỳ</option>
              {semesters.map((sem) => (
                <option key={sem.semesterId} value={sem.semesterId}>
                  {sem.semesterName}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition duration-150 cursor-pointer flex items-center gap-1 border-none"
            >
              <Download size={12} />
              Xuất Excel
            </button>
            <button
              onClick={() => navigate("/student/schedule")}
              className="px-3 py-2 text-xs font-semibold text-muted hover:text-DEFAULT bg-surface hover:bg-background border border-border rounded-md transition duration-150 cursor-pointer flex items-center gap-1"
            >
              <Calendar size={12} />
              Lịch học
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3 bg-surface border border-border rounded-md animate-pulse">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted font-medium">
              Đang tra cứu học phí công nợ...
            </span>
          </div>
        ) : (
          <>
            {/* Classes billing details grid table */}
            <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">
              {filteredRows.length === 0 ? (
                <div className="p-20 text-center">
                  <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-400">
                    Không có dữ liệu học phí
                  </h3>
                  <p className="text-muted mt-2 text-sm">
                    Bạn chưa đăng ký lớp học phần nào trong học kỳ được chọn.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Học kỳ</th>
                        <th className="px-6 py-4">Mã nhóm</th>
                        <th className="px-6 py-4">Môn học</th>
                        <th className="px-6 py-4 text-center">Tín chỉ</th>
                        <th className="px-6 py-4 text-right">Đơn giá / Tín</th>
                        <th className="px-6 py-4 text-right">Học phí phải thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {filteredRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-background/80 border-b border-border transition duration-150"
                        >
                          <td className="px-6 py-4 text-muted text-xs font-medium">
                            {row.semesterName}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted">
                            {row.classId}
                          </td>
                          <td className="px-6 py-4">
                            <span className="block font-semibold text-DEFAULT">
                              {row.subjectName}
                            </span>
                            <span className="text-xs text-muted font-mono">
                              ID: {row.subjectId}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-medium text-DEFAULT">
                            {row.credits}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-muted">
                            {formatVND(480000)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-DEFAULT">
                            {formatVND(row.fee)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Grand Total section */}
            <div className="bg-surface border border-border rounded-md p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted border-b border-border pb-2">
                {selectedSemester === "all"
                  ? "TỔNG CỘNG HỌC PHÍ LŨY KẾ"
                  : "TỔNG CỘNG HỌC PHÍ HỌC KỲ"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Gross Tuition */}
                <div className="bg-background/50 p-4 rounded-md border border-border flex flex-col justify-between">
                  <span className="text-xs font-semibold text-muted uppercase">
                    Tổng học phí phải thu
                  </span>
                  <span className="text-xl font-bold font-mono text-DEFAULT mt-1">
                    {formatVND(activeTotals.payableAmount !== undefined ? activeTotals.payableAmount : activeTotals.grossTuition)}
                  </span>
                </div>

                {/* Paid Amount */}
                <div className="bg-background/50 p-4 rounded-md border border-border flex flex-col justify-between">
                  <span className="text-xs font-semibold text-muted uppercase">
                    Tổng tiền đã thanh toán
                  </span>
                  <span className="text-xl font-bold font-mono text-DEFAULT mt-1">
                    {formatVND(activeTotals.paidAmount)}
                  </span>
                </div>

                {/* Debt Amount */}
                <div className="bg-background/50 p-4 rounded-md border border-border flex flex-col justify-between">
                  <span className="text-xs font-semibold text-muted uppercase">
                    Còn nợ (Chưa hoàn thành)
                  </span>
                  <span
                    className={`text-xl font-bold font-mono mt-1 ${activeTotals.debtAmount > 0 ? "text-rose-500" : "text-DEFAULT"}`}
                  >
                    {formatVND(activeTotals.debtAmount)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentTuition;
