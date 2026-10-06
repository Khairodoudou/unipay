"use client";

import { useState } from "react";
import Link from "next/link";
import { createOrganizationUnitAction } from "@/lib/admin/organization/actions";
import {
  FolderTree,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
} from "lucide-react";

interface UnitItem {
  id: string;
  name: string;
  code: string;
  type: string;
  parentId: string | null;
  isActive: boolean;
  parent: { name: string } | null;
  children: { id: string; name: string }[];
}

interface OrganizationUnitsListProps {
  organizationId: string;
  units: UnitItem[];
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  PRESIDENCY: "رئاسة الجامعة",
  SECRETARIAT_GENERAL: "أمانة عامة",
  FACULTY: "كلية",
  DIRECTION: "مديرية مركزية",
  SERVICE: "مصلحة / مديرية فرعية",
  DEPARTMENT: "قسم",
  OTHER: "وحدة أخرى",
};

export function OrganizationUnitsList({
  organizationId,
  units,
}: OrganizationUnitsListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("organizationId", organizationId);

    const res = await createOrganizationUnitAction(formData);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || "تعذر إضافة الوحدة.");
    } else {
      setSuccessMsg("تمت إضافة الوحدة التنظيمية بنجاح.");
      form.reset();
      setShowAddForm(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-teal-600" />
            <span>الهيكل التنظيمي الداخلي (الوحدات والمصالح)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            التقسيم الإداري الجامعي (الكليات، المصالح، والأمانة العامة)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm focus-ring cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة وحدة إدارية</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Inline Creation Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in"
        >
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-600" />
            <span>تسجيل وحدة تنظيمية جديدة</span>
          </h3>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الوحدة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="مثال: مصلحة المستخدمين"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرمز التقني <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                required
                dir="ltr"
                placeholder="UO-SG-PERS"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نوع الوحدة <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                required
                defaultValue="SERVICE"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700 font-medium"
              >
                <option value="PRESIDENCY">رئاسة الجامعة</option>
                <option value="SECRETARIAT_GENERAL">أمانة عامة</option>
                <option value="FACULTY">كلية</option>
                <option value="DIRECTION">مديرية مركزية</option>
                <option value="SERVICE">مصلحة / مديرية فرعية</option>
                <option value="DEPARTMENT">قسم</option>
                <option value="OTHER">وحدة أخرى</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الوحدة الأم التابعة لها (اختياري)
              </label>
              <select
                name="parentId"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
              >
                <option value="">-- بدون وحدة أم (مستوى رئيسي) --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4 sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>تفعيل الوحدة فوراً</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-60 flex items-center gap-1 cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>حفظ الوحدة</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Units Table */}
      {units.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          لم يتم تسجيل أي وحدات تنظيمية داخلية بعد.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-2.5 px-3">الوحدة الإدارية</th>
                <th className="py-2.5 px-3">الرمز</th>
                <th className="py-2.5 px-3">التصنيف</th>
                <th className="py-2.5 px-3">الوحدة التابعة لها</th>
                <th className="py-2.5 px-3">الحالة</th>
                <th className="py-2.5 px-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">
                      {unit.name}
                    </span>
                    {unit.children.length > 0 && (
                      <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">
                        تتبعها {unit.children.length} وحدة فرعية
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <code className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {unit.code}
                    </code>
                  </td>

                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                      {UNIT_TYPE_LABELS[unit.type] || unit.type}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    {unit.parent ? unit.parent.name : "— مستوى رئيسي"}
                  </td>

                  <td className="py-3 px-3">
                    {unit.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        نشطة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                        <XCircle className="w-3 h-3" />
                        معطلة
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-left">
                    <Link
                      href={`/admin/organization/${unit.id}`}
                      className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold"
                    >
                      <span>تعديل</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
