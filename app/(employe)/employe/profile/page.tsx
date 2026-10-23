import type { Metadata } from "next";
import {
  User,
  Briefcase,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  BadgeCheck,
} from "lucide-react";
import { getEmployeeProfile } from "@/lib/employe/employe-service";

export const metadata: Metadata = {
  title: "ملفي الشخصي — فضاء الموظف — أكاديميا شفاف",
  description: "البيانات الإدارية والمهنية المعتمدة للموظف",
};

export default async function EmployeProfilePage() {
  const profile = await getEmployeeProfile();

  return (
    <div className="space-y-6">
      {/* ── EN-TÊTE DU PROFIL ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {profile.firstName.slice(0, 1)}
              {profile.lastName.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>{profile.status === "ACTIVE" ? "حساب نشط" : profile.status}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-3">
                <span className="font-mono font-bold text-slate-700">
                  {profile.matricule}
                </span>
                <span>•</span>
                <span>{profile.position ?? "أستاذ باحث"}</span>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60 max-w-xs">
            <span className="font-bold text-slate-700 block mb-0.5">المؤسسة الجامعية</span>
            <span>{profile.organizationName}</span>
            {profile.organizationUnitName && (
              <span className="block text-slate-400 mt-0.5">{profile.organizationUnitName}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── AVERTISSEMENT LECTURE SEULE ────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold">معلومات إدارية ومالية للقراءة فقط</p>
          <p className="text-amber-800 mt-0.5">
            البيانات الوظيفية، السلالم الدرجية والبيانات المالية مستخرجة ومصدقة مباشرة من مصلحة المستخدمين والأجور. لأي تعديل أو تحيين، يرجى التواصل مع المديرية الفرعية للمستخدمين.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── SECTION 1 : DONNÉES PROFESSIONNELLES & STATUT ────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>البيانات المهنية والرتبة</span>
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">رقم التسجيل (Matricule)</span>
              <span className="font-mono font-bold text-slate-900">{profile.matricule}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">الوظيفة / المنصب</span>
              <span className="font-medium text-slate-900">{profile.position ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">الرتبة الأكاديمية (Grade)</span>
              <span className="font-semibold text-slate-900">{profile.grade ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">الصنف / الفئة</span>
              <span className="text-slate-900">{profile.category ?? "دائم"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">تاريخ التوظيف</span>
              <span className="text-slate-900 font-medium">
                {profile.recruitmentDate
                  ? new Date(profile.recruitmentDate).toLocaleDateString("ar-DZ")
                  : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 text-xs">حالة النشاط</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2 : DONNÉES FINANCIÈRES & BANCAIRES ─────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>البيانات المالية والحساب البنكي</span>
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">الراتب الأساسي المعتمد</span>
              <span className="font-mono font-bold text-slate-900">
                {profile.baseSalary.toLocaleString("fr-DZ", { minimumFractionDigits: 2 })} د.ج
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">النقطة الاستدلالية (Indice)</span>
              <span className="font-mono font-medium text-slate-900">
                {profile.index ?? "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">المؤسسة المالية / البنك</span>
              <span className="font-medium text-slate-900">
                {profile.bankName ?? "الخزينة العمومية"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 text-xs">رقم الحساب (RIB محمي)</span>
              <span className="font-mono font-semibold text-slate-700">
                {profile.maskedRib ?? "حساب بنكي مسجل"}
              </span>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                * يتم إخفاء جزء من رقم التعريف البنكي التزاماً بضوابط الخصوصية والأمن السيبراني.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3 : COORDONNÉES PERSONNELLES ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 md:col-span-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-slate-600" />
            <span>بيانات التواصل والملف الشخصي</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                البريد الإلكتروني المهني
              </span>
              <span className="font-mono font-medium text-slate-900 text-xs break-all">
                {profile.email ?? "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                الهاتف
              </span>
              <span className="font-mono font-medium text-slate-900 text-xs">
                {profile.phone ?? "غير مسجل"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                العنوان
              </span>
              <span className="font-medium text-slate-900 text-xs">
                {profile.address ?? "جامعة الجزائر 1"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
