"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserAction } from "@/lib/admin/users/actions";
import {
  UserPlus,
  Loader2,
  ShieldCheck,
  Building2,
  Mail,
  Lock,
  User,
  CheckCircle2,
} from "lucide-react";

interface RoleOption {
  id: string;
  code: string;
  nameAr: string;
}

interface OrgOption {
  id: string;
  name: string;
}

interface UserCreateFormProps {
  roles: RoleOption[];
  organizations: OrgOption[];
}

export function UserCreateForm({ roles, organizations }: UserCreateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await createUserAction(formData);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "تعذر إنشاء الحساب.");
    } else {
      setSuccessMessage("تم إنشاء المستخدم بنجاح! جاري التوجيه إلى القائمة...");
      setTimeout(() => {
        router.push("/admin/users");
      }, 1200);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold animate-fade-in flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 px-2"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              <span>المعلومات الشخصية والمهنية</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              بيانات الهوية الرسمية للحساب المؤسسي
            </p>
          </div>
        </div>

        {/* First & Last Name */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الاسم الأول <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              required
              minLength={2}
              placeholder="مثال: عبد القادر"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
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
              minLength={2}
              placeholder="مثال: بن عمار"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
            />
          </div>
        </div>

        {/* Email & Password */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>البريد الإلكتروني المؤسسي</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              dir="ltr"
              placeholder="user@unipay.dz"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>كلمة المرور الأولية</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              dir="ltr"
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              8 أحرف كحد أدنى، تشمل حرفاً كبيراً، صغيراً ورقماً.
            </p>
          </div>
        </div>

        {/* Role & Organization */}
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>الدور الوظيفي (الصلاحيات)</span> <span className="text-red-500">*</span>
            </label>
            <select
              name="roleId"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium text-slate-800"
            >
              <option value="">-- يرجى اختيار الدور الوظيفي --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameAr} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>المؤسسة الجامعية</span> <span className="text-red-500">*</span>
            </label>
            <select
              name="organizationId"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium text-slate-800"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Account Status Switch */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-800">
              حالة الحساب عند الإنشاء
            </span>
            <p className="text-[11px] text-slate-400">
              تحديد ما إذا كان الحساب مفعلاً للولوج المباشر أو معطلاً مؤقتاً
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/users"
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
        >
          إلغاء والعودة
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm focus-ring cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري التحقق والإنشاء...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>إنشاء الحساب وتأكيده</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
