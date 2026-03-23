import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Server, Upload, FileText, Clock, LogOut, AlertTriangle,
  CheckCircle, CloudUpload, X, Zap, Shield, Activity
} from "lucide-react";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "files">("overview");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: me } = trpc.auth.me.useQuery();
  const { data: account, isLoading: accountLoading } = trpc.user.getMyAccount.useQuery();
  const { data: myFiles } = trpc.user.getMyFiles.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const uploadMutation = trpc.user.uploadFile.useMutation({
    onSuccess: (data) => {
      toast.success(`تم رفع الملف وإرساله إلى تلغرام!`);
      utils.user.getMyFiles.invalidate();
      setUploading(false);
      setUploadProgress(0);
    },
    onError: (e) => {
      toast.error(e.message || "فشل رفع الملف");
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("حجم الملف يتجاوز 50 MB");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(10 + (e.loaded / e.total) * 50);
      };
      reader.onload = async () => {
        setUploadProgress(60);
        const base64 = (reader.result as string).split(",")[1];
        setUploadProgress(70);
        await uploadMutation.mutateAsync({
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          fileBase64: base64,
        });
        setUploadProgress(100);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [uploadMutation]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const formatDate = (d: Date | string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const tabs = [
    { id: "overview" as const, label: "نظرة عامة", icon: Shield },
    { id: "upload" as const, label: "رفع ملف", icon: Upload },
    { id: "files" as const, label: "ملفاتي", icon: FileText },
  ];

  const daysLeft = account?.hosting?.daysLeft ?? 0;
  const isExpired = account?.hosting?.isExpired ?? true;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col border-r" style={{ background: "oklch(0.09 0.03 265)", borderColor: "oklch(0.65 0.20 195 / 0.2)" }}>
        <div className="p-5 border-b" style={{ borderColor: "oklch(0.65 0.20 195 / 0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center pulse-cyan"
              style={{ background: "oklch(0.14 0.05 265)", border: "1px solid oklch(0.65 0.20 195 / 0.4)" }}>
              <Server className="w-4 h-4" style={{ color: "oklch(0.80 0.20 195)" }} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-widest neon-text-pink">OMAR HOST</h1>
              <p className="text-xs tracking-widest" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>USER PANEL</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? "oklch(0.65 0.20 195 / 0.12)" : "transparent",
                  color: isActive ? "oklch(0.80 0.20 195)" : "oklch(0.55 0.04 265)",
                  border: isActive ? "1px solid oklch(0.65 0.20 195 / 0.3)" : "1px solid transparent",
                }}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "oklch(0.65 0.20 195 / 0.15)" }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: "oklch(0.65 0.20 195 / 0.15)", color: "oklch(0.80 0.20 195)", border: "1px solid oklch(0.65 0.20 195 / 0.3)" }}>
              {(me as any)?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "oklch(0.85 0.01 265)" }}>{(me as any)?.username}</p>
              <p className="text-xs" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>USER</p>
            </div>
          </div>
          <button onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{ color: "oklch(0.60 0.22 25)", border: "1px solid oklch(0.60 0.22 25 / 0.3)" }}>
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b" style={{ borderColor: "oklch(0.65 0.20 195 / 0.15)", background: "oklch(0.09 0.025 265 / 0.8)" }}>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.92 0.01 265)" }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <p className="text-xs tracking-widest mt-0.5" style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>
            OMAR HOST / {(me as any)?.username?.toUpperCase()} / {activeTab.toUpperCase()}
          </p>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Status Banner */}
              {isExpired ? (
                <div className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ background: "oklch(0.60 0.22 25 / 0.1)", border: "1px solid oklch(0.60 0.22 25 / 0.3)" }}>
                  <AlertTriangle className="w-6 h-6 shrink-0" style={{ color: "oklch(0.70 0.22 25)" }} />
                  <div>
                    <p className="font-bold" style={{ color: "oklch(0.70 0.22 25)" }}>حسابك منتهي الصلاحية</p>
                    <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.04 265)" }}>تواصل مع الأدمن لتجديد اشتراكك</p>
                  </div>
                </div>
              ) : daysLeft <= 7 ? (
                <div className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ background: "oklch(0.75 0.20 60 / 0.1)", border: "1px solid oklch(0.75 0.20 60 / 0.3)" }}>
                  <Clock className="w-6 h-6 shrink-0" style={{ color: "oklch(0.75 0.20 60)" }} />
                  <div>
                    <p className="font-bold" style={{ color: "oklch(0.75 0.20 60)" }}>ينتهي حسابك قريباً</p>
                    <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.04 265)" }}>متبقي {daysLeft} أيام فقط</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ background: "oklch(0.75 0.15 150 / 0.1)", border: "1px solid oklch(0.75 0.15 150 / 0.3)" }}>
                  <CheckCircle className="w-6 h-6 shrink-0" style={{ color: "oklch(0.75 0.15 150)" }} />
                  <div>
                    <p className="font-bold" style={{ color: "oklch(0.75 0.15 150)" }}>حسابك نشط</p>
                    <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.04 265)" }}>متبقي {daysLeft} يوم</p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { label: "الأيام المتبقية", value: daysLeft, unit: "يوم", icon: Clock, color: daysLeft <= 3 ? "oklch(0.70 0.22 25)" : daysLeft <= 7 ? "oklch(0.75 0.20 60)" : "oklch(0.75 0.15 150)" },
                  { label: "السيرفرات المتاحة", value: account?.hosting?.maxServers ?? 0, unit: "سيرفر", icon: Server, color: "oklch(0.65 0.20 195)" },
                  { label: "الملفات المرفوعة", value: myFiles?.length ?? 0, unit: "ملف", icon: FileText, color: "oklch(0.65 0.28 340)" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="stat-card rounded-2xl p-6">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
                        <Icon className="w-5 h-5" style={{ color: s.color }} />
                      </div>
                      <p className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs" style={{ color: "oklch(0.55 0.04 265)" }}>{s.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Account Details */}
              <div className="neon-card rounded-2xl p-6">
                <h3 className="text-sm font-bold tracking-widest uppercase mb-5" style={{ color: "oklch(0.65 0.20 195)" }}>تفاصيل الحساب</h3>
                <div className="space-y-3">
                  {[
                    { label: "اسم المستخدم", value: (me as any)?.username, mono: true },
                    { label: "تاريخ الانتهاء", value: formatDate(account?.hosting?.expiresAt ?? null), mono: true },
                    { label: "عدد الأيام الكلي", value: `${account?.hosting?.daysAllowed ?? 0} يوم` },
                    { label: "الحالة", value: isExpired ? "منتهي" : "نشط" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "oklch(0.20 0.04 265)" }}>
                      <span className="text-sm" style={{ color: "oklch(0.55 0.04 265)" }}>{row.label}</span>
                      <span className="text-sm font-bold" style={{ color: "oklch(0.85 0.01 265)", fontFamily: row.mono ? "monospace" : "inherit" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Upload Tab ── */}
          {activeTab === "upload" && (
            <div className="max-w-2xl">
              {isExpired ? (
                <div className="neon-card rounded-2xl p-12 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.70 0.22 25)" }} />
                  <p className="text-lg font-bold mb-2" style={{ color: "oklch(0.70 0.22 25)" }}>حسابك منتهي الصلاحية</p>
                  <p className="text-sm" style={{ color: "oklch(0.45 0.03 265)" }}>لا يمكن رفع الملفات. تواصل مع الأدمن لتجديد اشتراكك.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Drop Zone */}
                  <div
                    className="rounded-2xl p-12 text-center cursor-pointer transition-all"
                    style={{
                      border: `2px dashed ${dragOver ? "oklch(0.65 0.28 340 / 0.8)" : "oklch(0.65 0.20 195 / 0.4)"}`,
                      background: dragOver ? "oklch(0.65 0.28 340 / 0.05)" : "oklch(0.11 0.03 265 / 0.5)",
                      boxShadow: dragOver ? "0 0 30px oklch(0.65 0.28 340 / 0.2)" : "none",
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
                    {uploading ? (
                      <div>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center pulse-pink"
                          style={{ background: "oklch(0.65 0.28 340 / 0.15)", border: "2px solid oklch(0.65 0.28 340 / 0.5)" }}>
                          <CloudUpload className="w-8 h-8" style={{ color: "oklch(0.80 0.28 340)" }} />
                        </div>
                        <p className="font-bold mb-3" style={{ color: "oklch(0.80 0.28 340)" }}>جاري الرفع...</p>
                        <div className="w-full max-w-xs mx-auto h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.20 0.04 265)" }}>
                          <div className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%`, background: "linear-gradient(to right, oklch(0.65 0.28 340), oklch(0.65 0.20 195))" }} />
                        </div>
                        <p className="text-sm mt-2" style={{ color: "oklch(0.55 0.04 265)" }}>{uploadProgress}%</p>
                      </div>
                    ) : (
                      <div>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                          style={{ background: "oklch(0.65 0.20 195 / 0.1)", border: "2px solid oklch(0.65 0.20 195 / 0.4)" }}>
                          <Upload className="w-8 h-8" style={{ color: "oklch(0.80 0.20 195)" }} />
                        </div>
                        <p className="text-lg font-bold mb-2" style={{ color: "oklch(0.85 0.01 265)" }}>اسحب الملف هنا أو انقر للاختيار</p>
                        <p className="text-sm" style={{ color: "oklch(0.45 0.03 265)" }}>الحد الأقصى: 50 MB — جميع أنواع الملفات مدعومة</p>
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs"
                          style={{ background: "oklch(0.65 0.28 340 / 0.1)", color: "oklch(0.80 0.28 340)", border: "1px solid oklch(0.65 0.28 340 / 0.3)" }}>
                          <Zap className="w-3 h-3" />
                          يُرسل تلقائياً إلى تلغرام
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="neon-card rounded-xl p-5">
                    <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "oklch(0.65 0.20 195)" }}>معلومات الرفع</p>
                    <ul className="space-y-2 text-sm" style={{ color: "oklch(0.55 0.04 265)" }}>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.75 0.15 150)" }} /> الملفات تُرفع إلى التخزين السحابي الآمن</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.75 0.15 150)" }} /> نسخة تُرسل تلقائياً إلى بوت تلغرام الأدمن</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.75 0.15 150)" }} /> الحد الأقصى لحجم الملف: 50 MB</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Files Tab ── */}
          {activeTab === "files" && (
            <div className="neon-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid oklch(0.65 0.20 195 / 0.15)" }}>
                    {["اسم الملف", "الحجم", "تلغرام", "التاريخ", ""].map(h => (
                      <th key={h} className="px-5 py-4 text-right text-xs font-bold tracking-widest uppercase"
                        style={{ color: "oklch(0.65 0.20 195)", fontFamily: "monospace" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myFiles?.map((f) => (
                    <tr key={f.id} className="border-b" style={{ borderColor: "oklch(0.20 0.04 265)" }}>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: "oklch(0.85 0.01 265)" }}>{f.originalName}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "oklch(0.55 0.04 265)" }}>{formatSize(f.fileSize)}</td>
                      <td className="px-5 py-3">
                        {f.telegramSent ? (
                          <span className="text-xs font-bold" style={{ color: "oklch(0.75 0.15 150)" }}>✓ أُرسل</span>
                        ) : (
                          <span className="text-xs" style={{ color: "oklch(0.45 0.03 265)" }}>معلّق</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "oklch(0.45 0.03 265)", fontFamily: "monospace" }}>
                        {formatDate(f.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <a href={f.fileUrl} target="_blank" rel="noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ color: "oklch(0.65 0.20 195)", border: "1px solid oklch(0.65 0.20 195 / 0.3)" }}>
                          تحميل
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!myFiles?.length && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: "oklch(0.40 0.03 265)" }}>لم ترفع أي ملفات بعد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
