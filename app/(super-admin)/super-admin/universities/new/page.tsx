import Link from "next/link";
import { requireSuperAdmin } from "@/lib/tenant/context";
import { UniversityCreateForm } from "@/components/super-admin/universities/UniversityCreateForm";
import { Building2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "تسجيل جامعة جديدة — الإدارة المركزية",
};

export default async function NewUniversityPage() {
  await requireSuperAdmin();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              تسجيل مؤسسة جامعية جديدة (Multi-Tenant Enrolment)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إنشاء نطاق معزول جديد في المنصة مع توليد الهيكل التنظيمي الأولي ورئاسة الجامعة
          </p>
        </div>

        <Link
          href="/super-admin/universities"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للدليل</span>
        </Link>
      </div>

      <UniversityCreateForm />
    </div>
  );
}
