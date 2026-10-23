import { requireSuperAdmin } from "@/lib/tenant/context";
import {
  Sliders,
  ShieldCheck,
  Lock,
  Server,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Sliders className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            حوكمة المنصة والسياسات المركزية (Platform Governance)
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          إعدادات الأمان، العزل المؤسسي المتعدد (Multi-Tenancy Isolation)، والسياسات الوطنية الموحدة
        </p>
      </div>

      {/* Policy 1: Multi-Tenant Architecture & Isolation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              العزل المؤسسي الصارم (Strict Tenant Isolation)
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            مفعل بشكل إلزامي (Enforced)
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          تعتمد المنصة استراتيجية العزل المنطقي الصارم لقواعد البيانات (Discriminator Column Pattern) مع التحقق الإجباري من هوية المؤسسة في طبقة الـ Server Actions والـ Prisma Queries. لا يمكن لأي مستخدم محلي (سواء مدير أو محاسب أو عون موارد بشرية) الوصول أو التعديل على بيانات مؤسسة جامعية أخرى تحت أي ظرف.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">مفتاح العزل الأساسي</span>
            <span className="text-xs font-mono font-bold text-indigo-700">Organization.id</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">مستوى الحماية</span>
            <span className="text-xs font-bold text-emerald-700">Zero IDOR Tolerance</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">حالة التحقق بالخادم</span>
            <span className="text-xs font-bold text-slate-800">100% Server Verified</span>
          </div>
        </div>
      </div>

      {/* Policy 2: Security & Session Policies */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">
            سياسات الأمان والجلسات المعتمدة وطنيا
          </h2>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">تشفير كلمات المرور</p>
              <p className="text-slate-500 text-[11px]">
                تشفير أحادي الاتجاه بواسطة خوارزمية Bcrypt مع 12 جولة ملحية (Rounds = 12). لا يتم تخزين كلمات المرور الصريحة مطلقا.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">جلسات العمل المقترنة بـ HttpOnly Cookies</p>
              <p className="text-slate-500 text-[11px]">
                ملفات تعريف الارتباط محمية بخاصية SameSite=Lax و HttpOnly و Secure لمنع هجمات XSS وسرقة الجلسات.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">التدقيق الرقابي الدائم (Audit Logging)</p>
              <p className="text-slate-500 text-[11px]">
                جميع إجراءات المصادقة المالية، تعيين المسؤولين، وتجميد المؤسسات تسجل في قاعدة بيانات التدقيق مع توثيق الفاعل والتوقيت.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Policy 3: Platform Information */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Server className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-900">
            معلومات البنية التحتية للمنصة
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">الإصدار المعماري</span>
            <span className="font-mono font-bold text-slate-800">أكاديميا شفاف v2.0-MT</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">نمط الإطار البرمجي</span>
            <span className="font-mono font-bold text-slate-800">Next.js 16 App Router</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">محرك البيانات</span>
            <span className="font-mono font-bold text-slate-800">Prisma ORM + SQLite</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">النطاق الإقليمي</span>
            <span className="font-bold text-slate-800">الجمهورية الجزائرية</span>
          </div>
        </div>
      </div>
    </div>
  );
}
