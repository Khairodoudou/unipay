"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Save,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  User,
  Briefcase,
  Loader2,
} from "lucide-react";
import { createEmployeeAction } from "@/lib/agent/employee-actions";

interface OrgUnit {
  id: string;
  name: string;
}

interface EmployeeFormProps {
  organizationId: string;
  units: OrgUnit[];
}

export function EmployeeForm({ organizationId, units }: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createEmployeeAction(formData);

      if (!res.success) {
        setError(res.error || "حدث خطأ غير متوقع أثناء إضافة الموظف");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/agent/employees/${res.data?.employeeId}`);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذر إرسال النموذج");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="organizationId" value={organizationId} />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>تم تسجيل الموظف بنجاح! جاري الانتقال إلى الملف الشخصي...</span>
        </div>
      )}

      {/* Section 1: Informations Personnelles */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">المعلومات الشخصية</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الرقم الوظيفي (Matricule) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="matricule"
              required
              placeholder="مثال: EMP-2026-001"
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الاسم الأول <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              required
              placeholder="مثال: محمد"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اللقب <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              required
              placeholder="مثال: بن علي"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              تاريخ الميلاد
            </label>
            <input
              type="date"
              name="dateOfBirth"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الجنس
            </label>
            <select
              name="gender"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 bg-white"
            >
              <option value="">غير محدد</option>
              <option value="M">ذكر</option>
              <option value="F">أنثى</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رقم بطاقة التعريف الوطنية (CIN)
            </label>
            <input
              type="text"
              name="nationalId"
              placeholder="رقم بطاقة التعريف"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Informations Administratives & Professionnelles */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Briefcase className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">المعلومات الإدارية والوظيفية</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الرتبة الأكاديمية أو الإدارية (Grade)
            </label>
            <input
              type="text"
              name="grade"
              placeholder="مثال: أستاذ محاضر أ / مهندس رئيسي"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              المنصب / الوظيفة (Poste)
            </label>
            <input
              type="text"
              name="position"
              placeholder="مثال: رئيس قسم الإعلام الآلي"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              طبيعة العقد (Catégorie)
            </label>
            <select
              name="category"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 bg-white"
            >
              <option value="PERMANENT">دائم (Titulaire / Permanent)</option>
              <option value="CONTRACTUEL">تعاقدي (Contractuel)</option>
              <option value="VACATAIRE">ساعاتي (Vacataire)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              المصلحة / الكلية
            </label>
            <select
              name="organizationUnitId"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 bg-white"
            >
              <option value="">بدون مصلحة محددة (الإدارة المركزية)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              تاريخ التوظيف
            </label>
            <input
              type="date"
              name="recruitmentDate"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              حالة الموظف
            </label>
            <select
              name="status"
              defaultValue="ACTIVE"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 bg-white"
            >
              <option value="ACTIVE">نشط (ACTIVE)</option>
              <option value="SUSPENDED">معلق (SUSPENDED)</option>
              <option value="INACTIVE">غير نشط (INACTIVE)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Informations Salariales & Bancaires */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <DollarSign className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">المعلومات المالية والبنكية</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الراتب الأساسي (دج) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="baseSalary"
              required
              placeholder="مثال: 55000.00"
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الرقم الاستدلالي (Indice)
            </label>
            <input
              type="number"
              name="index"
              placeholder="مثال: 575"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم البنك أو البريد
            </label>
            <input
              type="text"
              name="bankName"
              placeholder="مثال: بريد الجزائر / BNA / BADR"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رقم الحساب البنكي / البريدي (RIB - 20 رقماً)
            </label>
            <input
              type="text"
              name="rib"
              maxLength={20}
              placeholder="مثال: 00799999000123456789"
              className="w-full px-3 py-2 text-xs font-mono tracking-wider rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رقم الهاتف
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="مثال: 0661234567"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              placeholder="example@univ.dz"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              العنوان الشخصي
            </label>
            <input
              type="text"
              name="address"
              placeholder="العنوان الكامل للموظف"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          href="/agent/employees"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>إلغاء والعودة للقائمة</span>
        </Link>

        <button
          type="submit"
          disabled={loading || success}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 shadow-md hover:shadow-lg transition-all focus-ring cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري الحفظ والتحقق...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>تسجيل الموظف في النظام</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
