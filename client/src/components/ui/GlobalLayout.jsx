import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import UserProfile from "../../pages/common/UserProfile";
import ChangePassword from "../../pages/auth/ChangePassword";
import {
  GraduationCap,
  User,
  Key,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
const GlobalLayout = () => {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const logout = useAuthStore((state) => state.logout);

  const setProfileOpen = useAuthStore((state) => state.setProfileOpen);

  const setChangePasswordOpen = useAuthStore(
    (state) => state.setChangePasswordOpen,
  );

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));

    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  let dashboardPath = "/login";
  let logoTitle = "PTIT Portal";
  if (user) {
    if (user.role === "admin") {
      dashboardPath = "/admin/dashboard";
      logoTitle = "PTIT Portal Admin";
    } else if (user.role === "instructor") {
      dashboardPath = "/instructor/dashboard";
      logoTitle = "PTIT Portal Giảng Viên";
    } else if (user.role === "student") {
      dashboardPath = "/student/dashboard";
      logoTitle = "PTIT Portal Sinh Viên";
    }
  }
  const handleLogoutClick = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-DEFAULT text-DEFAULT font-sans flex flex-col transition-colors duration-150">
      {" "}
      {/* Fixed Top Navigation Bar */}{" "}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface border-b border-border px-6 py-4 flex justify-between items-center shadow-enterprise transition-colors duration-150">
        {" "}
        <Link
          to={dashboardPath}
          className="flex items-center gap-3 hover:opacity-90 transition"
        >
          {" "}
          <GraduationCap className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-wider text-DEFAULT">
            {" "}
            {logoTitle}
          </span>{" "}
        </Link>
        <div className="flex items-center gap-4">
          {" "}
          {/* Theme Toggler Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-DEFAULT transition cursor-pointer"
            title={
              darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"
            }
          >
            {" "}
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-sm text-muted font-medium cursor-pointer flex items-center gap-1 select-none focus:outline-none"
            >
              {" "}
              Xin chào,
              <span className="text-DEFAULT font-bold hover:text-primary transition underline decoration-dotted">
                {user?.fullName || "User"}
              </span>{" "}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>{" "}
            {dropdownOpen && (
              <>
                {" "}
                {/* Click outside handler */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-3 w-48 bg-surface border border-border rounded-lg shadow-enterprise py-2 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setProfileOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-DEFAULT hover:text-slate-900 dark:hover:text-DEFAULT hover:bg-slate-100 dark:hover:bg-surface transition flex items-center gap-2 cursor-pointer"
                  >
                    {" "}
                    <User size={14} className="text-slate-400" /> Thông tin cá
                    nhân
                  </button>
                  <button
                    onClick={() => {
                      setChangePasswordOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-DEFAULT hover:text-slate-900 dark:hover:text-DEFAULT hover:bg-slate-100 dark:hover:bg-surface transition flex items-center gap-2 cursor-pointer"
                  >
                    {" "}
                    <Key size={14} className="text-slate-400" /> Đổi mật khẩu
                  </button>{" "}
                  <hr className="border-border my-1.5" />
                  <button
                    onClick={() => {
                      handleLogoutClick();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-surface transition flex items-center gap-2 cursor-pointer"
                  >
                    {" "}
                    <LogOut size={14} className="text-rose-500" /> Đăng xuất
                  </button>
                </div>{" "}
              </>
            )}
          </div>
        </div>{" "}
      </header>{" "}
      {/* Spacer for Fixed Header + Main Content Space */}{" "}
      <main className="flex-1 pt-20 flex flex-col">
        {" "}
        <Outlet />{" "}
      </main>{" "}
      {/* Modals rendered globally */} <UserProfile /> <ChangePassword />
    </div>
  );
};

export default GlobalLayout;
