"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  UserX,
  AlertTriangle,
  RefreshCw,
  LogOut,
  HelpCircle,
  ShieldAlert,
  Building,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

export default function EmployeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Employe Space Error:", error);
  }, [error]);

  const errorMessage = error?.message || "";
  const isNoEmployeeLink = errorMessage.includes("UNAUTHORIZED_NO_EMPLOYEE_LINK");
  const isSuspended = errorMessage.includes("EMPLOYEE_SUSPENDED");
  const isNotFound = errorMessage.includes("EMPLOYEE_NOT_FOUND");

  // Cas 1 : Compte utilisateur non relié à une fiche employé
  if (isNoEmployeeLink) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 animate-fade-in">
        <div className="bg-white rounded-3xl border border-amber-200/90 p-8 sm:p-10 shadow-lg relative overflow-hidden">
          {/* Bannière d'ambiance en dégradé subtil */}
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

          <div className="flex flex-col items-center text-center">
            {/* Icône d'avertissement institutionnelle */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5 shadow-xs">
              <UserX className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>حساب غير مقترن بملف إداري</span>
            </span>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              حساب المستخدم غير مرتبط ببطاقة موظف
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-lg mb-6">
              تم تسجيل دخولك بنجاح بالدور المؤسسي <strong className="text-slate-800">«موظف»</strong>، ولكن لم يتم بعد ربط حسابك الإلكتروني بملف موظف إداري نشط في مصلحة الموارد البشرية.
            </p>

            {/* Boîte d'instructions institutionnelles */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-right space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>ما الإجراء المطلوب لتفعيل فضاء الموظف؟</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pr-2 list-disc list-inside">
                <li>
                  يرجى التواصل مع <strong>مصلحة الموارد البشرية (عون الأجور)</strong> أو <strong>مسؤول النظام بالجامعة</strong>.
                </li>
                <li>
                  التأكد من تسجيل رقمك الإداري (الماتريكول) وربط بريدك الإلكتروني المؤسسي بملفك الوظيفي.
                </li>
                <li>
                  إذا تم الربط مؤخراً من طرف الإدارة، يرجى النقر على زر «إعادة المحاولة» لتحديث الجلسة.
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة وتحديث الجلسة</span>
              </button>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>تسجيل الخروج</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cas 2 : Dossier employé suspendu ou inactif
  if (isSuspended) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 animate-fade-in">
        <div className="bg-white rounded-3xl border border-rose-200/90 p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-rose-500 to-red-600" />

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-5 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 mb-3">
              <span>ملف إداري معلق</span>
            </span>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              ملف الموظف غير نشط أو معلق
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-lg mb-6">
              الملف الوظيفي المرتبط بحسابك الإداري مصنّف حالياً في حالة غير نشطة أو معلّقة. يرجى مراجعة إدارة شؤون المستخدمين أو مصلحة الموارد البشرية بالجامعة لتسوية الوضعية الإدارية.
            </p>

            <div className="flex items-center gap-3">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>تسجيل الخروج</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cas 3 : Dossier employé introuvable
  if (isNotFound) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 animate-fade-in">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 mx-auto mb-5">
            <Building className="w-8 h-8" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">
            ملف الموظف غير موجود
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            تعذر العثور على بطاقة الموظف المطابقة في قاعدة البيانات.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      </div>
    );
  }

  // Cas générique par défaut
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">
        حدث خطأ أثناء معالجة البيانات
      </h2>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {errorMessage || "تعذر تحميل البيانات المطلوبة في فضاء الموظف. يرجى المحاولة مرة أخرى."}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-2xs"
        >
          <span>الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
