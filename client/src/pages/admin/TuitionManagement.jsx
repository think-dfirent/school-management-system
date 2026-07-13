import { useState, useEffect } from "react";
import { Wallet, Search, Filter, MoreHorizontal, Edit3, Eye, CheckCircle, AlertTriangle, X, DollarSign, RefreshCw } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const TuitionManagement = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // Data States
  const [tuitions, setTuitions] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Filter & Search States
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Alert State
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "success" });
    }, 4500);
  };

  // Modals States
  const [editModal, setEditModal] = useState({ show: false, data: null });
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Format Currency Helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // Calculate dynamic totals based on current list
  const totalPayable = tuitions.reduce((acc, curr) => acc + (curr.payableAmount || 0), 0);
  const totalPaid = tuitions.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalDebt = tuitions.reduce((acc, curr) => acc + (curr.debtAmount || 0), 0);

  // Fetch Semesters & Set Default Selected
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSemesters = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/semesters", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSemesters(res.data);
        
        // Find active semester to select by default
        const activeSem = res.data.find((sem) => sem.isActive);
        if (activeSem) {
          setSelectedSemester(activeSem._id);
        } else if (res.data.length > 0) {
          setSelectedSemester(res.data[0]._id);
        }
      } catch (err) {
        showAlert("Không thể tải danh sách học kỳ!", "error");
      }
    };

    fetchSemesters();
  }, [token, navigate]);

  // Fetch Tuition Data
  const fetchTuitionData = async () => {
    if (!token || !selectedSemester) return;
    try {
      setLoading(true);
      const params = {};
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get("http://localhost:5000/api/tuition", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setTuitions(res.data);
    } catch (err) {
      showAlert("Lỗi khi tải danh sách học phí!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTuitionData();
  }, [selectedSemester, selectedStatus, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTuitionData();
  };

  // Update Payment handler
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editModal.data) return;

    try {
      setSubmitting(true);
      const res = await axios.put(
        `http://localhost:5000/api/tuition/${editModal.data._id}/payment`,
        { paidAmount: editPaidAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert(res.data.message || "Cập nhật thanh toán thành công!", "success");
      setEditModal({ show: false, data: null });
      fetchTuitionData();
    } catch (err) {
      showAlert(err.response?.data?.message || "Lỗi khi cập nhật thanh toán!", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Sync all tuition data handler
  const handleSyncTuitions = async () => {
    try {
      setSyncing(true);
      const res = await axios.post(
        "http://localhost:5000/api/tuition/sync",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert(res.data.message || "Đã đồng bộ lại toàn bộ học phí!", "success");
      fetchTuitionData();
    } catch (err) {
      showAlert(err.response?.data?.message || "Lỗi khi đồng bộ học phí!", "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 text-DEFAULT font-sans transition-colors duration-150 relative">
      
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
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-DEFAULT">Quản lý Học phí</h1>
        <p className="text-sm text-muted mt-1">
          Theo dõi và cập nhật trạng thái đóng học phí của sinh viên
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-border rounded-md shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm Mã SV, Họ tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-md transition-colors text-sm border-none cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Semester dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted whitespace-nowrap">Học kỳ:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-DEFAULT text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all"
            >
              <option value="">-- Chọn học kỳ --</option>
              {semesters.map((sem) => (
                <option key={sem._id} value={sem._id}>
                  {sem.semesterName}
                </option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-muted whitespace-nowrap">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-DEFAULT text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all"
            >
              <option value="all">Tất cả</option>
              <option value="paid">Đã nộp đủ</option>
              <option value="partial">Nộp một phần</option>
              <option value="unpaid">Chưa nộp</option>
            </select>
          </div>

          <button
            onClick={handleSyncTuitions}
            disabled={syncing}
            className="ml-auto inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 px-3 py-2 rounded-md text-sm font-semibold transition-colors border border-border disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Đồng bộ dữ liệu
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-md shadow-sm p-4 flex flex-col justify-center animate-fade-in">
          <span className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
            Tổng phải thu
          </span>
          <span className="text-xl font-bold text-DEFAULT font-mono">
            {formatCurrency(totalPayable)}
          </span>
        </div>
        <div className="bg-surface border border-border rounded-md shadow-sm p-4 flex flex-col justify-center animate-fade-in">
          <span className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
            Tổng đã nộp
          </span>
          <span className="text-xl font-bold text-DEFAULT font-mono">
            {formatCurrency(totalPaid)}
          </span>
        </div>
        <div className="bg-surface border border-border rounded-md shadow-sm p-4 flex flex-col justify-center animate-fade-in">
          <span className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
            Tổng còn nợ
          </span>
          <span className="text-xl font-bold text-rose-500 font-mono">
            {formatCurrency(totalDebt)}
          </span>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-surface border border-border rounded-md shadow-sm p-12 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted text-sm font-medium animate-pulse">
            Đang tải dữ liệu học phí...
          </span>
        </div>
      ) : tuitions.length === 0 ? (
        <div className="bg-surface border border-border rounded-md shadow-sm p-12 text-center text-muted">
          Không tìm thấy hồ sơ học phí nào phù hợp với bộ lọc
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md shadow-sm overflow-x-auto min-h-[290px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Mã SV</th>
                <th className="px-6 py-4">Họ và Tên</th>
                <th className="px-6 py-4">Tổng Phải Thu</th>
                <th className="px-6 py-4">Đã Nộp</th>
                <th className="px-6 py-4">Còn Nợ</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {tuitions.map((t, index) => (
                <tr key={t._id} className="hover:bg-background/80 transition duration-150">
                  <td className="py-3 px-4 align-middle font-mono font-semibold text-DEFAULT">
                    {t.student?.userId || "-"}
                  </td>
                  <td className="py-3 px-4 align-middle font-bold text-DEFAULT">
                    {t.student?.fullName || "Sinh viên không tồn tại"}
                  </td>
                  <td className="py-3 px-4 align-middle font-mono text-DEFAULT">
                    {formatCurrency(t.payableAmount)}
                  </td>
                  <td className="py-3 px-4 align-middle font-mono text-DEFAULT font-medium">
                    {formatCurrency(t.paidAmount)}
                  </td>
                  <td className="py-3 px-4 align-middle font-mono text-DEFAULT font-medium">
                    {formatCurrency(t.debtAmount)}
                  </td>
                  <td className="py-3 px-4 align-middle text-center">
                    {t.status === "paid" ? (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 whitespace-nowrap">
                        Đã nộp đủ
                      </span>
                    ) : t.status === "partial" ? (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20 whitespace-nowrap">
                        Nộp một phần
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20 whitespace-nowrap">
                        Chưa nộp
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 align-middle text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === t._id ? null : t._id)}
                        className="p-2 rounded-md text-muted hover:text-DEFAULT hover:bg-background transition-colors focus:outline-none cursor-pointer"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {openDropdownId === t._id && (
                        <>
                          {/* Click outside backdrop */}
                          <div
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setOpenDropdownId(null)}
                          />
                          <div className={`absolute right-0 w-44 bg-surface border border-border rounded-md shadow-xl z-50 overflow-hidden text-left animate-in fade-in duration-150 ${
                            index >= tuitions.length - 2 && tuitions.length > 2
                              ? "bottom-full mb-1 origin-bottom"
                              : "top-full mt-1 origin-top"
                          }`}>
                            <button
                              onClick={() => {
                                setEditPaidAmount(t.paidAmount.toString());
                                setEditModal({ show: true, data: t });
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-muted hover:text-DEFAULT hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Cập nhật thanh toán
                            </button>
                            <button
                              onClick={() => {
                                setDetailModal({ show: true, data: t });
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-muted hover:text-DEFAULT hover:bg-background transition-colors flex items-center gap-2 border-none cursor-pointer bg-transparent"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem chi tiết
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editModal.show && editModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-background/50">
              <h3 className="font-bold text-DEFAULT flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Cập nhật thanh toán
              </h3>
              <button
                onClick={() => setEditModal({ show: false, data: null })}
                className="text-muted hover:text-DEFAULT cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
              <div>
                <span className="block text-xs font-bold uppercase text-muted tracking-wider mb-1">
                  Mã SV / Sinh viên
                </span>
                <p className="text-sm font-semibold text-DEFAULT">
                  {editModal.data.student?.userId} - {editModal.data.student?.fullName}
                </p>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase text-muted tracking-wider mb-1">
                  Học kỳ
                </span>
                <p className="text-sm text-DEFAULT">
                  {editModal.data.semester?.semesterName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase text-muted tracking-wider mb-1">
                    Tổng phải thu
                  </span>
                  <p className="text-sm font-mono text-DEFAULT font-semibold">
                    {formatCurrency(editModal.data.payableAmount)}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-muted tracking-wider mb-1">
                    Còn nợ hiện tại
                  </span>
                  <p className="text-sm font-mono text-rose-500 font-semibold">
                    {formatCurrency(editModal.data.debtAmount)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted tracking-wider mb-1.5">
                  Số tiền đã đóng (VND) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={editModal.data.payableAmount}
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-DEFAULT font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  placeholder="Nhập tổng số tiền đã nộp..."
                />
                <span className="block text-[11px] text-muted mt-1">
                  Nhập số tiền đã đóng thực tế. Hệ thống sẽ tự động cập nhật số tiền còn nợ và trạng thái đóng học phí.
                </span>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, data: null })}
                  className="bg-transparent border border-border text-muted hover:text-DEFAULT hover:bg-background/50 font-semibold py-2 px-4 rounded-md transition-colors text-sm cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-5 rounded-md transition-colors border-none flex items-center justify-center gap-1.5 text-sm cursor-pointer disabled:opacity-50"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {detailModal.show && detailModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-background/50">
              <h3 className="font-bold text-DEFAULT flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Chi tiết học phí
              </h3>
              <button
                onClick={() => setDetailModal({ show: false, data: null })}
                className="text-muted hover:text-DEFAULT cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="flex items-center gap-4 bg-background/50 p-4 border border-border rounded-md">
                <div className="p-2 bg-primary/10 text-primary rounded-md">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-DEFAULT text-sm">{detailModal.data.student?.fullName}</h4>
                  <p className="text-xs text-muted font-mono">{detailModal.data.student?.userId} | {detailModal.data.student?.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-border text-sm">
                  <span className="text-muted">Học kỳ:</span>
                  <span className="font-semibold text-DEFAULT">{detailModal.data.semester?.semesterName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border text-sm">
                  <span className="text-muted">Học phí gốc:</span>
                  <span className="font-mono font-semibold text-DEFAULT">{formatCurrency(detailModal.data.totalFee)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border text-sm">
                  <span className="text-muted">Miễn giảm:</span>
                  <span className="font-mono font-semibold text-rose-500">{formatCurrency(detailModal.data.discount)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border text-sm">
                  <span className="text-muted">Học phí phải nộp:</span>
                  <span className="font-mono font-semibold text-DEFAULT">{formatCurrency(detailModal.data.payableAmount)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border text-sm">
                  <span className="text-muted">Đã thanh toán:</span>
                  <span className="font-mono font-semibold text-emerald-500">{formatCurrency(detailModal.data.paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border text-sm">
                  <span className="text-muted">Học phí còn nợ:</span>
                  <span className="font-mono font-semibold text-rose-500">{formatCurrency(detailModal.data.debtAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Trạng thái:</span>
                  <span>
                    {detailModal.data.status === "paid" ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Đã nộp đủ
                      </span>
                    ) : detailModal.data.status === "partial" ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        Nộp một phần
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        Chưa nộp
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailModal({ show: false, data: null })}
                  className="bg-transparent border border-border text-muted hover:text-DEFAULT hover:bg-background/50 font-semibold py-2 px-5 rounded-md transition-colors text-sm cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TuitionManagement;
