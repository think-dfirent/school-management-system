import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw,
  AlertTriangle,
  Users,
  GraduationCap,
  School,
  Wallet,
  BookOpen,
  BarChart3,
  Calendar,
  Mail,
  Megaphone,
  UserCheck,
} from "lucide-react";
const AdminDashboard = () => {
  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);

  const currentUser = useAuthStore((state) => state.user);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    openClasses: 0,
    totalRevenue: 0,
    studentsByDepartment: [],
    gradeDistribution: [],
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        "http://localhost:5000/api/dashboard/stats",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStats(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể tải dữ liệu thống kê!",
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
    fetchStats();
  }, [token]);

  const isEmptyState =
    stats.totalStudents === 0 &&
    stats.totalInstructors === 0 &&
    stats.openClasses === 0 &&
    stats.totalRevenue === 0;
  const hasDeptData =
    stats.studentsByDepartment && stats.studentsByDepartment.length > 0;
  const hasGradeData =
    stats.gradeDistribution && stats.gradeDistribution.length > 0;
  const GRADE_COLORS = {
    "A+": "#10b981",
    A: "#10b981",
    "B+": "#3b82f6",
    B: "#3b82f6",
    "C+": "#f59e0b",
    C: "#f59e0b",
    "D+": "#f97316",
    D: "#f97316",
    F: "#e11d48",
  };

  const DEPT_COLORS = ["#E11D48", "#475569", "#06B6D4", "#64748B", "#F43F5E"];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8 text-DEFAULT">
      {" "}
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {" "}
            Học kỳ 1 Năm học 2026 - 2027
          </h1>
          <p className="text-xs text-muted mt-1">
            {" "}
            Hệ thống Quản lý Đào tạo | Admin Portal
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 text-xs font-bold text-DEFAULT bg-surface hover:bg-slate-100 dark:hover:bg-surface border border-border rounded-md shadow-sm transition duration-150 cursor-pointer flex items-center gap-1.5"
        >
          {" "}
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
        </button>
      </div>{" "}
      {error && (
        <div className="p-4 rounded-md bg-rose-500/10 border border-rose-500/25 text-sm text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
          {" "}
          <AlertTriangle className="w-4 h-4 text-rose-500" /> {error}
        </div>
      )}{" "}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted font-medium animate-pulse">
            Đang thu thập dữ liệu hệ thống...
          </span>
        </div>
      ) : (
        <>
          {" "}
          {/* 4 Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {" "}
            {/* Card 1: Students */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-enterprise flex items-center gap-4 animate-fade-in">
              <div className="p-3 bg-rose-500/10 text-primary rounded-md">
                {" "}
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Tổng Sinh Viên
                </span>
                <span className="text-2xl font-black font-mono text-DEFAULT">
                  {stats.totalStudents || 0}
                </span>
              </div>
            </div>{" "}
            {/* Card 2: Instructors */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-enterprise flex items-center gap-4 animate-fade-in">
              <div className="p-3 bg-rose-500/10 text-primary rounded-md">
                {" "}
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Tổng Giảng Viên
                </span>
                <span className="text-2xl font-black font-mono text-DEFAULT">
                  {stats.totalInstructors || 0}
                </span>
              </div>
            </div>{" "}
            {/* Card 3: Classes */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-enterprise flex items-center gap-4 animate-fade-in">
              <div className="p-3 bg-rose-500/10 text-primary rounded-md">
                {" "}
                <School className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Lớp HP Kế Hoạch
                </span>
                <span className="text-2xl font-black font-mono text-DEFAULT">
                  {stats.openClasses || 0}
                </span>
              </div>
            </div>{" "}
            {/* Card 4: Tuition revenue */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-enterprise flex items-center gap-4 animate-fade-in">
              <div className="p-3 bg-rose-500/10 text-primary rounded-md">
                {" "}
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Tổng Thu Học Phí
                </span>
                <span className="text-lg font-bold font-mono text-DEFAULT break-all">
                  {formatCurrency(stats.totalRevenue || 0)}
                </span>
              </div>
            </div>
          </div>{" "}
          {/* Quick Navigation Panels */}
          <div className="bg-surface border border-border rounded-md p-6 shadow-enterprise">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
              Các Phân Hệ Quản Lý Hành Chính
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <button
                onClick={() => navigate("/admin/users")}
                className="p-4 bg-slate-50 dark:bg-background/60 hover:bg-slate-100 dark:hover:bg-surface border border-border rounded-md flex flex-col items-center justify-center text-center transition duration-150 group cursor-pointer"
              >
                {" "}
                <Users className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-semibold text-DEFAULT mt-2">
                  Quản lý Tài khoản
                </span>
              </button>
              <button
                onClick={() => navigate("/admin/subjects")}
                className="p-4 bg-slate-50 dark:bg-background/60 hover:bg-slate-100 dark:hover:bg-surface border border-border rounded-md flex flex-col items-center justify-center text-center transition duration-150 group cursor-pointer"
              >
                {" "}
                <BookOpen className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-semibold text-DEFAULT mt-2">
                  Danh mục Môn học
                </span>
              </button>
              <button
                onClick={() => navigate("/admin/classes")}
                className="p-4 bg-slate-50 dark:bg-background/60 hover:bg-slate-100 dark:hover:bg-surface border border-border rounded-md flex flex-col items-center justify-center text-center transition duration-150 group cursor-pointer"
              >
                {" "}
                <School className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-semibold text-DEFAULT mt-2">
                  Quản lý Lớp học phần
                </span>
              </button>
              <button
                onClick={() => navigate("/admin/grades")}
                className="p-4 bg-slate-50 dark:bg-background/60 hover:bg-slate-100 dark:hover:bg-surface border border-border rounded-md flex flex-col items-center justify-center text-center transition duration-150 group cursor-pointer"
              >
                {" "}
                <BarChart3 className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-semibold text-DEFAULT mt-2">
                  Quản lý Điểm số
                </span>
              </button>
              <button
                onClick={() => navigate("/admin/semesters")}
                className="p-4 bg-slate-50 dark:bg-background/60 hover:bg-slate-100 dark:hover:bg-surface border border-border rounded-md flex flex-col items-center justify-center text-center transition duration-150 group cursor-pointer"
              >
                {" "}
                <Calendar className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-semibold text-DEFAULT mt-2">
                  Quản lý Học kỳ
                </span>
              </button>
              <button
                onClick={() => navigate("/admin/support")}
                className="p-4 bg-slate-50 dark:bg-background/60 hover:bg-slate-100 dark:hover:bg-surface border border-border rounded-md flex flex-col items-center justify-center text-center transition duration-150 group cursor-pointer"
              >
                {" "}
                <Mail className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-semibold text-DEFAULT mt-2">
                  Yêu cầu Hỗ trợ
                </span>
              </button>
              <button
                onClick={() => navigate("/admin/notifications")}
                className="p-4 bg-slate-50 dark:bg-background/60 hover:bg-slate-100 dark:hover:bg-surface border border-border rounded-md flex flex-col items-center justify-center text-center transition duration-150 group cursor-pointer"
              >
                {" "}
                <Megaphone className="w-6 h-6 text-muted group-hover:text-primary group-hover:scale-105 transition" />
                <span className="text-xs font-semibold text-DEFAULT mt-2">
                  Phát hành Thông báo
                </span>
              </button>
            </div>
          </div>{" "}
          {/* Visual Charts section */}{" "}
          {isEmptyState ? (
            <div className="bg-surface border border-border border-dashed rounded-md p-16 flex flex-col items-center justify-center text-center shadow-enterprise">
              {" "}
              <BarChart3 className="w-12 h-12 text-muted mb-4 opacity-50" />{" "}
              <h4 className="text-sm font-bold text-DEFAULT">
                Chưa có dữ liệu thống kê
              </h4>
              <p className="text-xs text-muted mt-1 max-w-sm">
                Hệ thống chưa ghi nhận tài khoản hoặc học phần đào tạo nào hoạt
                động. Biểu đồ sẽ hiển thị ngay khi cơ sở dữ liệu được nạp dữ
                liệu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {" "}
              {/* Bar Chart: Students by Department */}
              <div className="bg-surface border border-border rounded-md p-5 shadow-enterprise flex flex-col h-[360px]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
                  Quy mô sinh viên theo khoa
                </h3>
                <div className="flex-1 w-full relative min-h-[260px]">
                  {" "}
                  {!hasDeptData ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 font-semibold">
                      {" "}
                      Chưa có dữ liệu thống kê
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <BarChart
                        data={stats.studentsByDepartment}
                        margin={{ top: 10, right: 30, left: -20, bottom: 5 }}
                      >
                        {" "}
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          className="opacity-40"
                        />{" "}
                        <XAxis
                          dataKey="departmentName"
                          stroke="#94a3b8"
                          tick={{ fontSize: 11 }}
                        />{" "}
                        <YAxis
                          stroke="#94a3b8"
                          tick={{ fontSize: 11 }}
                          allowDecimals={false}
                        />{" "}
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "6px",
                            padding: "8px 12px",
                          }}
                          labelStyle={{
                            color: "var(--text-primary)",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                          itemStyle={{
                            color: "var(--text-primary)",
                            fontSize: "12px",
                          }}
                        />{" "}
                        <Legend
                          wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                        />{" "}
                        <Bar
                          dataKey="count"
                          name="Số lượng sinh viên"
                          radius={[4, 4, 0, 0]}
                        >
                          {" "}
                          {stats.studentsByDepartment.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={DEPT_COLORS[index % DEPT_COLORS.length]}
                            />
                          ))}{" "}
                        </Bar>{" "}
                      </BarChart>{" "}
                    </ResponsiveContainer>
                  )}
                </div>
              </div>{" "}
              {/* Pie Chart: Grade Distribution */}
              <div className="bg-surface border border-border rounded-md p-5 shadow-enterprise flex flex-col h-[360px]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
                  Phân bố kết quả học tập (Điểm chữ)
                </h3>
                <div className="flex-1 w-full relative min-h-[260px]">
                  {" "}
                  {!hasGradeData ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 font-semibold">
                      {" "}
                      Chưa có dữ liệu thống kê
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {" "}
                      <PieChart>
                        {" "}
                        <Pie
                          data={stats.gradeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="letterGrade"
                        >
                          {" "}
                          {stats.gradeDistribution.map((entry, index) => {
                            const color =
                              GRADE_COLORS[entry.letterGrade] || "#94a3b8";
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}{" "}
                        </Pie>{" "}
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "6px",
                            padding: "8px 12px",
                          }}
                          labelStyle={{
                            color: "var(--text-primary)",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                          itemStyle={{
                            color: "var(--text-primary)",
                            fontSize: "12px",
                          }}
                        />{" "}
                        <Legend
                          wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                        />{" "}
                      </PieChart>{" "}
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}{" "}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
