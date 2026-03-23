import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Eye, EyeOff, Server, Zap, Shield } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`مرحباً ${data.username}!`);
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      // Reload to refresh auth state
      setTimeout(() => window.location.reload(), 100);
    },
    onError: (err) => {
      toast.error(err.message || "فشل تسجيل الدخول");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Vertical neon lines */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.65_0.20_195/0.5)] to-transparent" />
      <div className="absolute right-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.65_0.28_340/0.5)] to-transparent" />
      <div className="absolute left-16 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.65_0.20_195/0.15)] to-transparent" />
      <div className="absolute right-16 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.65_0.28_340/0.15)] to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[oklch(0.65_0.20_195/0.05)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[oklch(0.65_0.28_340/0.05)] blur-3xl pointer-events-none" />

      <div className="w-full max-w-md px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 pulse-cyan"
            style={{ background: "linear-gradient(135deg, oklch(0.12 0.04 265), oklch(0.15 0.06 265))", border: "1px solid oklch(0.65 0.20 195 / 0.4)" }}>
            <Server className="w-10 h-10" style={{ color: "oklch(0.80 0.20 195)" }} />
          </div>
          <h1 className="text-5xl font-black tracking-widest mb-2 neon-text-pink" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            OMAR HOST
          </h1>
          <p className="text-sm tracking-[0.3em] uppercase" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>
            ◈ SECURE HOSTING PLATFORM ◈
          </p>
        </div>

        {/* Login Card */}
        <div className="neon-card rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4" style={{ color: "oklch(0.65 0.28 340)" }} />
            <span className="text-xs tracking-[0.2em] uppercase" style={{ color: "oklch(0.65 0.28 340)" }}>
              تسجيل الدخول
            </span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, oklch(0.65 0.28 340 / 0.5), transparent)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "oklch(0.65 0.20 195)" }}>
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full px-4 py-3 rounded-lg text-sm input-neon"
                style={{ fontFamily: "monospace" }}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "oklch(0.65 0.20 195)" }}>
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full px-4 py-3 rounded-lg text-sm input-neon pr-12"
                  style={{ fontFamily: "monospace" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                  style={{ color: "oklch(0.55 0.04 265)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3.5 rounded-lg font-bold tracking-widest text-sm uppercase neon-btn-pink disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  دخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t" style={{ borderColor: "oklch(0.20 0.04 265)" }}>
            <p className="text-center text-xs" style={{ color: "oklch(0.40 0.03 265)" }}>
              لا يمكن إنشاء حسابات جديدة — التسجيل عبر الأدمن فقط
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs tracking-widest" style={{ color: "oklch(0.30 0.03 265)", fontFamily: "monospace" }}>
          OMAR HOST © 2026 — ALL RIGHTS RESERVED
        </p>
      </div>
    </div>
  );
}
