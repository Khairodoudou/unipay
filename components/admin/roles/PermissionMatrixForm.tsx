"use client";

import { useState } from "react";
import { updateRolePermissionsAction } from "@/lib/admin/roles/actions";
import {
  KeyRound,
  Save,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";

interface PermissionItem {
  id: string;
  code: string;
  nameAr: string;
  category: string;
}

interface PermissionMatrixFormProps {
  roleId: string;
  roleCode: string;
  allPermissions: PermissionItem[];
  initialPermissionCodes: string[];
}

const CATEGORY_NAMES: Record<string, string> = {
  SYSTEM: "الإدارة والنظام",
  USERS: "إدارة المستخدمين",
  AUDIT: "التدقيق والرقابة",
  PAYROLL: "الأجور وإعداد المسيرات",
  ACCOUNTING: "المحاسبة وأوامر الصرف",
  FINANCIAL_CONTROL: "الرقابة المالية والتأشيرات",
  EMPLOYEE: "ملفات الموظفين وكشوف الراتب",
};

const ESSENTIAL_ADMIN_PERMISSIONS = [
  "admin.access",
  "system.settings",
  "settings.read",
  "settings.update",
  "roles.read",
  "roles.update",
  "permissions.read",
  "permissions.update",
  "users.read",
  "users.update",
  "users.disable",
  "audit.read",
];

export function PermissionMatrixForm({
  roleId,
  roleCode,
  allPermissions,
  initialPermissionCodes,
}: PermissionMatrixFormProps) {
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    initialPermissionCodes
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = roleCode === "ADMIN";

  const handleToggle = (code: string) => {
    // Si c'est l'ADMIN et que la permission est essentielle, on empêche de la désélectionner
    if (isAdmin && ESSENTIAL_ADMIN_PERMISSIONS.includes(code)) {
      alert("هذه الصلاحية حيوية لمدير النظام ولا يمكن إزالتها.");
      return;
    }

    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await updateRolePermissionsAction(roleId, selectedCodes);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "فشل حفظ الصلاحيات.");
    } else {
      setSuccessMessage("تم تحديث وحفظ مصفوفة الصلاحيات لهذا الدور بنجاح.");
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Grouper les permissions par catégorie
  const grouped = allPermissions.reduce<Record<string, PermissionItem[]>>(
    (acc, perm) => {
      const cat = perm.category || "SYSTEM";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(perm);
      return acc;
    },
    {}
  );

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

      {/* Grid of Categories */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, perms]) => {
          const categoryTitle = CATEGORY_NAMES[category] || category;
          const activeCount = perms.filter((p) =>
            selectedCodes.includes(p.code)
          ).length;

          return (
            <div
              key={category}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {categoryTitle}
                  </h3>
                </div>

                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {activeCount} من {perms.length}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map((perm) => {
                  const isChecked = selectedCodes.includes(perm.code);
                  const isLocked =
                    isAdmin && ESSENTIAL_ADMIN_PERMISSIONS.includes(perm.code);

                  return (
                    <label
                      key={perm.code}
                      className={`p-3 rounded-2xl border text-xs flex items-start gap-3 transition-all cursor-pointer ${
                        isChecked
                          ? "bg-teal-50/50 border-teal-200 text-teal-950 font-medium"
                          : "bg-slate-50/50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(perm.code)}
                        disabled={isLocked}
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 leading-tight">
                            {perm.nameAr}
                          </span>
                          {isLocked && (
                            <span
                              title="صلاحية حيوية مقفلة لمدير النظام"
                              className="text-amber-600 shrink-0"
                            >
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <code className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {perm.code}
                        </code>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating or bottom save bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">
            إجمالي الصلاحيات المختارة لهذا الدور:
          </span>
          <strong className="text-sm font-black text-teal-300 font-mono">
            {selectedCodes.length}
          </strong>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition-all focus-ring cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري حفظ الصلاحيات...</span>
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
  );
}
