import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Users, Plus, Edit2, Trash2, RefreshCw, BarChart3,
  FileText, Activity, LogOut, Server, Clock, Shield,
  CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, ChevronRight
} from "lucide-react";

type Tab = "users" | "stats" | "files" | "logs";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: me } = trpc.auth.me.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery();
  const { data: stats } = trpc.admin.getStats.useQuery();
  const { data: files } = trpc.admin.getAllFiles.useQuery();
  const { data: logs } = trpc.admin.getLogs.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success("تم حذف المستخدم"); utils.admin.getUsers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "users", label: "المستخدمون", icon: Users },
    { id: "stats", label: "الإحصائيات", icon: BarChart3 },
    { id: "files", label: "الملفات", icon: FileText },
    { id: "logs", label: "السجلات", icon: Activity },
  ];

  const formatDate = (d: Date | string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  };

  const getDaysLeft = (expiresAt: Date | string | null) => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r" style={{ background: "oklch(0.09 0.03 265)", borderColor: "oklch(0.65 0.20 195 / 0.2)" }}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: "oklch(0.65 0.20 195 / 0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center pulse-cyan"
              style={{ background: "oklch(0.14 0.05 265)", border: "1px solid oklch(0.65 0.20 195 / 0.4)" }}>
              <Server className="w-5 h-5" style={{ color: "oklch(0.80 0.20 195)" }} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-widest neon-text-pink">OMAR HOST</h1>
              <p className="text-xs tracking-widest" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>ADMIN PANEL</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? "oklch(0.65 0.28 340 / 0.15)" : "transparent",
                  color: isActive ? "oklch(0.80 0.28 340)" : "oklch(0.60 0.04 265)",
                  border: isActive ? "1px solid oklch(0.65 0.28 340 / 0.3)" : "1px solid transparent",
                  boxShadow: isActive ? "0 0 12px oklch(0.65 0.28 340 / 0.2)" : "none",
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t" style={{ borderColor: "oklch(0.65 0.20 195 / 0.15)" }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: "oklch(0.65 0.28 340 / 0.2)", color: "oklch(0.80 0.28 340)", border: "1px solid oklch(0.65 0.28 340 / 0.3)" }}>
              {(me as any)?.username?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "oklch(0.85 0.01 265)" }}>{(me as any)?.username}</p>
              <p className="text-xs" style={{ color: "oklch(0.65 0.28 340)", fontFamily: "monospace" }}>ADMIN</p>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{ color: "oklch(0.60 0.22 25)", border: "1px solid oklch(0.60 0.22 25 / 0.3)" }}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-8 py-5 border-b flex items-center justify-between" style={{ borderColor: "oklch(0.65 0.20 195 / 0.15)", background: "oklch(0.09 0.025 265 / 0.8)" }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "oklch(0.92 0.01 265)" }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs tracking-widest mt-0.5" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>
              OMAR HOST / ADMIN / {activeTab.toUpperCase()}
            </p>
          </div>
          {activeTab === "users" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold neon-btn-pink"
            >
              <Plus className="w-4 h-4" />
              إنشاء حساب
            </button>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* ── Users Tab ── */}
          {activeTab === "users" && (
            <div>
              {usersLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "oklch(0.65 0.20 195 / 0.3)", borderTopColor: "oklch(0.65 0.20 195)" }} />
                </div>
              ) : (
                <div className="neon-card rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid oklch(0.65 0.20 195 / 0.15)" }}>
                        {["المستخدم", "الحالة", "السيرفرات", "الأيام المتبقية", "الانتهاء", "الإجراءات"].map(h => (
                          <th key={h} className="px-5 py-4 text-right text-xs font-bold tracking-widest uppercase"
                            style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users?.filter(u => u.role !== "admin").map((user) => {
                        const daysLeft = getDaysLeft(user.hosting?.expiresAt ?? null);
                        const isExpired = user.hosting ? new Date(user.hosting.expiresAt) <= new Date() : true;
                        return (
                          <tr key={user.id} className="border-b transition-colors"
                            style={{ borderColor: "oklch(0.20 0.04 265)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.65 0.20 195 / 0.04)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                  style={{ background: "oklch(0.65 0.20 195 / 0.15)", color: "oklch(0.80 0.20 195)", border: "1px solid oklch(0.65 0.20 195 / 0.3)" }}>
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-sm" style={{ color: "oklch(0.92 0.01 265)", fontFamily: "monospace" }}>{user.username}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {user.isActive && !isExpired ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                  style={{ background: "oklch(0.75 0.15 150 / 0.15)", color: "oklch(0.75 0.15 150)", border: "1px solid oklch(0.75 0.15 150 / 0.3)" }}>
                                  <CheckCircle className="w-3 h-3" /> نشط
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                  style={{ background: "oklch(0.60 0.22 25 / 0.15)", color: "oklch(0.70 0.22 25)", border: "1px solid oklch(0.60 0.22 25 / 0.3)" }}>
                                  <AlertTriangle className="w-3 h-3" /> منتهي
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                  style={{ background: "oklch(0.55 0.04 265 / 0.15)", color: "oklch(0.55 0.04 265)", border: "1px solid oklch(0.55 0.04 265 / 0.3)" }}>
                                  <XCircle className="w-3 h-3" /> معطّل
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-bold" style={{ color: "oklch(0.65 0.20 195)" }}>{user.hosting?.maxServers ?? 0}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-bold" style={{ color: daysLeft <= 3 ? "oklch(0.70 0.22 25)" : daysLeft <= 7 ? "oklch(0.75 0.20 60)" : "oklch(0.75 0.15 150)" }}>
                                {daysLeft} يوم
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm" style={{ color: "oklch(0.55 0.04 265)", fontFamily: "monospace" }}>
                              {formatDate(user.hosting?.expiresAt ?? null)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingUser(user); setShowEditModal(true); }}
                                  className="p-2 rounded-lg transition-all"
                                  style={{ color: "oklch(0.65 0.20 195)", border: "1px solid oklch(0.65 0.20 195 / 0.3)" }}
                                  title="تعديل">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { if (confirm(`حذف ${user.username}؟`)) deleteUserMutation.mutate({ userId: user.id }); }}
                                  className="p-2 rounded-lg transition-all"
                                  style={{ color: "oklch(0.70 0.22 25)", border: "1px solid oklch(0.60 0.22 25 / 0.3)" }}
                                  title="حذف">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!users?.filter(u => u.role !== "admin").length && (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "oklch(0.40 0.03 265)" }}>
                            لا يوجد مستخدمون حتى الآن
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Stats Tab ── */}
          {activeTab === "stats" && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, color: "oklch(0.65 0.20 195)" },
                { label: "المستخدمون النشطون", value: stats.activeUsers, icon: CheckCircle, color: "oklch(0.75 0.15 150)" },
                { label: "الحسابات المنتهية", value: stats.expiredUsers, icon: AlertTriangle, color: "oklch(0.70 0.22 25)" },
                { label: "إجمالي الملفات", value: stats.totalFiles, icon: FileText, color: "oklch(0.65 0.28 340)" },
                { label: "إجمالي السيرفرات", value: stats.totalServers, icon: Server, color: "oklch(0.70 0.18 290)" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="stat-card rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
                        <Icon className="w-6 h-6" style={{ color: s.color }} />
                      </div>
                    </div>
                    <p className="text-4xl font-black mb-1" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-sm" style={{ color: "oklch(0.55 0.04 265)" }}>{s.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Files Tab ── */}
          {activeTab === "files" && (
            <div className="neon-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid oklch(0.65 0.20 195 / 0.15)" }}>
                    {["المستخدم", "اسم الملف", "الحجم", "تلغرام", "التاريخ"].map(h => (
                      <th key={h} className="px-5 py-4 text-right text-xs font-bold tracking-widest uppercase"
                        style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {files?.map((f) => (
                    <tr key={f.id} className="border-b" style={{ borderColor: "oklch(0.20 0.04 265)" }}>
                      <td className="px-5 py-3 text-sm font-bold" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>{f.username}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "oklch(0.75 0.01 265)" }}>
                        <a href={f.fileUrl} target="_blank" rel="noreferrer" className="hover:underline">{f.originalName}</a>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "oklch(0.55 0.04 265)" }}>
                        {f.fileSize ? `${(f.fileSize / 1024 / 1024).toFixed(2)} MB` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {f.telegramSent ? (
                          <span style={{ color: "oklch(0.75 0.15 150)" }}>✓ أُرسل</span>
                        ) : (
                          <span style={{ color: "oklch(0.55 0.04 265)" }}>معلّق</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "oklch(0.45 0.03 265)", fontFamily: "monospace" }}>
                        {formatDate(f.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {!files?.length && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: "oklch(0.40 0.03 265)" }}>لا توجد ملفات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Logs Tab ── */}
          {activeTab === "logs" && (
            <div className="neon-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid oklch(0.65 0.20 195 / 0.15)" }}>
                    {["المستخدم", "الإجراء", "التفاصيل", "التاريخ"].map(h => (
                      <th key={h} className="px-5 py-4 text-right text-xs font-bold tracking-widest uppercase"
                        style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((log) => (
                    <tr key={log.id} className="border-b" style={{ borderColor: "oklch(0.20 0.04 265)" }}>
                      <td className="px-5 py-3 text-sm font-bold" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>{log.username || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: "oklch(0.65 0.28 340 / 0.15)", color: "oklch(0.80 0.28 340)", border: "1px solid oklch(0.65 0.28 340 / 0.3)" }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "oklch(0.65 0.04 265)" }}>{log.details || "—"}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: "oklch(0.45 0.03 265)", fontFamily: "monospace" }}>
                        {new Date(log.createdAt).toLocaleString("ar-SA")}
                      </td>
                    </tr>
                  ))}
                  {!logs?.length && (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: "oklch(0.40 0.03 265)" }}>لا توجد سجلات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); utils.admin.getUsers.invalidate(); utils.admin.getStats.invalidate(); }} />}

      {/* Edit User Modal */}
      {showEditModal && editingUser && <EditUserModal user={editingUser} onClose={() => { setShowEditModal(false); setEditingUser(null); }} onSuccess={() => { setShowEditModal(false); setEditingUser(null); utils.admin.getUsers.invalidate(); }} />}
    </div>
  );
}

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ username: "", password: "", maxServers: 1, daysAllowed: 30 });
  const [showPwd, setShowPwd] = useState(false);

  const createMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => { toast.success("تم إنشاء الحساب بنجاح"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-lg font-black tracking-widest mb-6 neon-text-cyan">إنشاء حساب جديد</h3>
      <div className="space-y-4">
        <Field label="اسم المستخدم">
          <input className="w-full px-4 py-3 rounded-lg text-sm input-neon" style={{ fontFamily: "monospace" }}
            value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
        </Field>
        <Field label="كلمة المرور">
          <div className="relative">
            <input className="w-full px-4 py-3 rounded-lg text-sm input-neon pr-10" style={{ fontFamily: "monospace" }}
              type={showPwd ? "text" : "password"} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.55 0.04 265)" }}>
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="عدد السيرفرات">
            <input type="number" min={1} max={100} className="w-full px-4 py-3 rounded-lg text-sm input-neon"
              value={form.maxServers} onChange={e => setForm(f => ({ ...f, maxServers: +e.target.value }))} />
          </Field>
          <Field label="عدد الأيام">
            <input type="number" min={1} max={3650} className="w-full px-4 py-3 rounded-lg text-sm input-neon"
              value={form.daysAllowed} onChange={e => setForm(f => ({ ...f, daysAllowed: +e.target.value }))} />
          </Field>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ border: "1px solid oklch(0.25 0.04 265)", color: "oklch(0.55 0.04 265)" }}>إلغاء</button>
          <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}
            className="flex-1 py-3 rounded-xl text-sm font-bold neon-btn-pink disabled:opacity-50">
            {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Edit User Modal ───────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    username: user.username,
    password: "",
    isActive: user.isActive,
    maxServers: user.hosting?.maxServers ?? 1,
    extendDays: 0,
  });

  const updateMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => { toast.success("تم تحديث الحساب"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const input: any = { userId: user.id, isActive: form.isActive, maxServers: form.maxServers };
    if (form.password) input.password = form.password;
    if (form.extendDays > 0) input.extendDays = form.extendDays;
    updateMutation.mutate(input);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-lg font-black tracking-widest mb-6 neon-text-cyan">تعديل: <span className="neon-text-pink">{user.username}</span></h3>
      <div className="space-y-4">
        <Field label="كلمة مرور جديدة (اختياري)">
          <input type="password" className="w-full px-4 py-3 rounded-lg text-sm input-neon" style={{ fontFamily: "monospace" }}
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="اتركه فارغاً للإبقاء على القديمة" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="عدد السيرفرات">
            <input type="number" min={1} max={100} className="w-full px-4 py-3 rounded-lg text-sm input-neon"
              value={form.maxServers} onChange={e => setForm(f => ({ ...f, maxServers: +e.target.value }))} />
          </Field>
          <Field label="تمديد (أيام إضافية)">
            <input type="number" min={0} max={3650} className="w-full px-4 py-3 rounded-lg text-sm input-neon"
              value={form.extendDays} onChange={e => setForm(f => ({ ...f, extendDays: +e.target.value }))} />
          </Field>
        </div>
        <Field label="حالة الحساب">
          <div className="flex gap-3">
            {[{ v: true, l: "نشط" }, { v: false, l: "معطّل" }].map(opt => (
              <button key={String(opt.v)} onClick={() => setForm(f => ({ ...f, isActive: opt.v }))}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: form.isActive === opt.v ? (opt.v ? "oklch(0.75 0.15 150 / 0.2)" : "oklch(0.60 0.22 25 / 0.2)") : "transparent",
                  color: form.isActive === opt.v ? (opt.v ? "oklch(0.75 0.15 150)" : "oklch(0.70 0.22 25)") : "oklch(0.55 0.04 265)",
                  border: `1px solid ${form.isActive === opt.v ? (opt.v ? "oklch(0.75 0.15 150 / 0.4)" : "oklch(0.60 0.22 25 / 0.4)") : "oklch(0.25 0.04 265)"}`,
                }}>
                {opt.l}
              </button>
            ))}
          </div>
        </Field>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ border: "1px solid oklch(0.25 0.04 265)", color: "oklch(0.55 0.04 265)" }}>إلغاء</button>
          <button onClick={handleSave} disabled={updateMutation.isPending}
            className="flex-1 py-3 rounded-xl text-sm font-bold neon-btn-cyan disabled:opacity-50">
            {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0 / 0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="neon-card-pink rounded-2xl p-8 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "oklch(0.65 0.20 195)" }}>{label}</label>
      {children}
    </div>
  );
}
