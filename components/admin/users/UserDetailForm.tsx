"use client";

import { useState } from "react";
import Link from "next/link";
import {
  updateUserAction,
  resetUserPasswordAction,
} from "@/lib/admin/users/actions";
import {
  Save,
  KeyRound,
  ShieldCheck,
  Building2,
  Mail,
  User,
  Loader2,
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

interface UserDetailFormProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    roleId: string;
    organizationId: string;
    role: { code: string; nameAr: string };
    organization: { name: string };
  };
  roles: RoleOption[];
  organizations: OrgOption[];
}

export function UserDetailForm({ user, roles, organizations }: UserDetailFormProps) {
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    const formData = new FormData(e.currentTarget);
    formData.set("userId", user.id);

    const res = await updateUserAction(formData);
    setUpdateLoading(false);

    if (!res.success) {
      setUpdateError(res.error || "فشل تحديث البيانات.");
    } else {
      setUpdateSuccess("تم تحديث بيانات المستخدم بنجاح.");
      setTimeout(() => setUpdateSuccess(null), 4000);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !window.confirm(
        "هل أنت متأكد من رغبتك في إعادة تعيين كلمة المرور لهذا المستخدم؟ سيتم إنهاء كافة جلساته النشطة فوراً."
      )
    ) {
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("userId", user.id);

    const res = await resetUserPasswordAction(formData);
    setPasswordLoading(false);

    if (!res.success) {
      setPasswordError(res.error || "فشل تعيين كلمة المرور.");
    } else {
      setPasswordSuccess("تم تحديث كلمة المرور وإنهاء الجلسات السابقة بنجاح.");
      form.reset();
      setTimeout(() => setPasswordSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Edit Main Profile Form */}
      <form onSubmit={handleUpdate} className="space-y-6">
        {updateError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold animate-fade-in flex items-center justify-between">
            <span>{updateError}</span>
            <button
              type="button"
              onClick={() => setUpdateError(null)}
              className="text-red-600 hover:text-red-900 px-2"
            >
              ✕
            </button>
          </div>
        )}

        {updateSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{updateSuccess}</span>
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>البيانات الأساسية وتخصيص الدور</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تعديل الاسم، البريد، والدور المؤسسي (محمي بقواعد استمرارية الإدارة)
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الاسم الأول <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                defaultValue={user.firstName}
                required
                minLength={2}
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
                defaultValue={user.lastName}
                required
                minLength={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>البريد الإلكتروني المؤسسي</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              defaultValue={user.email}
              required
              dir="ltr"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>الدور الوظيفي</span> <span className="text-red-500">*</span>
              </label>
              <select
                name="roleId"
                defaultValue={user.roleId}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium text-slate-800"
              >
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
                <span>المؤسسة</span> <span className="text-red-500">*</span>
              </label>
              <select
                name="organizationId"
                defaultValue={user.organizationId}
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
                حالة الحساب (تفعيل / تعطيل)
              </span>
              <p className="text-[11px] text-slate-400">
                تعطيل الحساب يمنع المستخدم من الدخول ويلغي كافة جلساته المفتوحة
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                value="true"
                defaultChecked={user.isActive}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/users"
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            disabled={updateLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm focus-ring cursor-pointer disabled:opacity-60"
          >
            {updateLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Password Reset Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>إعادة تعيين كلمة المرور الإدارية</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تغيير كلمة المرور يجبر الحساب على تسجيل دخول جديد ويلغي كافة الجلسات الحالية
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              dir="ltr"
              placeholder="••••••••••••"
              className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              8 أحرف كحد أدنى، حرف كبير، حرف صغير ورقم.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all focus-ring cursor-pointer disabled:opacity-60"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-800" />
                  <span>جاري التعيين...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-amber-800" />
                  <span>تأكيد تغيير كلمة المرور</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
