import { useState } from "react";
import { GraduationCap, AlertTriangle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // API call to login endpoint
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
      );

      const { token, user } = response.data;
      // Save credentials inside Zustand global store
      login(user, token);

      // Role-Based Redirection Landing Pages
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "instructor") {
        navigate("/instructor/dashboard");
      } else if (user.role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      // Exception 4.1: Display exact warning from server
      setError(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra kết nối mạng!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-DEFAULT flex flex-col justify-center items-center p-4 transition-colors duration-150">
      
      {/* Enterprise Card Container */}
      <div className="w-full max-w-sm bg-surface border border-border rounded-md shadow-lg p-8 relative space-y-6">
        
        <div className="text-center relative">
          <GraduationCap className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-DEFAULT tracking-tight">
            PTIT Portal
          </h2>
          <p className="text-xs text-muted mt-1 font-medium tracking-wide">
            CỔNG THÔNG TIN QUẢN LÝ ĐÀO TẠO
          </p>
        </div>

        {/* Error Notice Message Block */}
        {error && (
          <div className="p-3 text-xs text-primary bg-primary/10 border border-primary/25 rounded-md font-semibold flex items-center gap-1.5">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4 relative" onSubmit={handleLogin}>
          {/* Email */}
          <div>
            <label className="text-xs font-bold uppercase text-muted tracking-wider block mb-2">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-DEFAULT w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              placeholder="username@ptit.edu.vn"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold uppercase text-muted tracking-wider block mb-2">
              Mật khẩu truy cập
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-DEFAULT w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white w-full py-3 rounded-md font-bold transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng nhập hệ thống</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-[10px] text-muted font-mono">
          Học viện Công nghệ Bưu chính Viễn thông
        </div>
      </div>
    </div>
  );
};

export default Login;
