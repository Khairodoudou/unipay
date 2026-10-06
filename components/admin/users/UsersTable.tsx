"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Edit,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Power,
  Clock,
  Loader2,
} from "lucide-react";
import { toggleUserStatusAction } from "@/lib/admin/users/actions";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: {
    id: string;
    code: string;
    nameAr: string;
  };
  organization: {
    id: string;
    name: string;
  };
}

interface UsersTableProps {
  users: UserItem[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = !user.isActive;
    const confirmText = nextStatus
      ? `هل أنت متأكد من رغبتك في تفعيل حساب ${user.firstName} ${user.lastName}؟`
      : `هل أنت متأكد من رغبتك في تعطيل حساب ${user.firstName} ${user.lastName}؟ لن يتمكن من تسجيل الدخول.`;

    if (!window.confirm(confirmText)) {
      return;
    }

    setLoadingId(user.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await toggleUserStatusAction(user.id, nextStatus);
    setLoadingId(null);

    if (!res.success) {
      setErrorMessage(res.error || "فشلت العملية");
    } else {
      setSuccessMessage(
        nextStatus ? "تم تفعيل الحساب بنجاح." : "تم تعطيل الحساب بنجاح."
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">
              لا توجد حسابات مطابقة لمعايير البحث
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              يرجى تعديل الفلاتر أو إفراغ خانة البحث لعرض كافة المستخدمين.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold">
                  <th className="py-3 px-4">المستخدم</th>
                  <th className="py-3 px-4">الدور الوظيفي</th>
                  <th className="py-3 px-4">المؤسسة الجامعية</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">آخر دخول</th>
                  <th className="py-3 px-4">تاريخ الإنشاء</th>
                  <th className="py-3 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isLoading = loadingId === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {user.firstName[0]}
                          </div>
                          <div>
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="font-bold text-slate-900 hover:text-teal-700 block transition-colors"
                            >
                              {user.firstName} {user.lastName}
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {user.role.nameAr}
                          </span>
                          <code className="text-[10px] font-mono text-teal-700">
                            {user.role.code}
                          </code>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-600 font-medium">
                          {user.organization.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            مفعّل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <XCircle className="w-3 h-3" />
                            معطّل
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {user.lastLoginAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(user.lastLoginAt).toLocaleString("ar-DZ", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">لم يدخل بعد</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString("ar-DZ")}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                            title="تعديل ومعاينة الحساب"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            disabled={isLoading}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              user.isActive
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={
                              user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"
                            }
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>

                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="الملف الكامل"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
