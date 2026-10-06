import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/rbac/guards";
import { ImportClient } from "@/components/agent/employees/ImportClient";
import { Upload, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "استيراد الموظفين من ملف Excel — مساحة الموارد البشرية — UNI-PAY",
  description: "استيراد جماعي لملفات الموظفين وقواعد التحقق المسبقة",
};

export default async function EmployeeImportPage() {
  const user = await requireRole(["AGENT_RH", "ADMIN"]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
              <Upload className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              استيراد الموظفين من Excel / CSV
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            استيراد بيانات الموظفين دفعة واحدة مع التحقق المسبق من صحة الأرقام الوظيفية والرواتب
          </p>
        </div>

        <Link
          href="/agent/employees"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all self-start sm:self-auto"
        >
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span>العودة للسجل</span>
        </Link>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-start gap-3 text-xs text-teal-900">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">ضمان سلامة البيانات وفق متطلبات المرحلة 4:</p>
          <p className="text-teal-800 leading-relaxed">
            تتم عملية الاستيراد عبر خطة تدقيق متسلسلة: (رفع ← تحليل ← مطابقة الأعمدة ← معاينة كاملة ← فحص التكرار والأخطاء ← إدراج عبر معاملة ذرية DB Transaction ← تسجيل في سجل التدقيق). لا يتم إدخال أي سجل مباشرة بدون مراجعة وموافقة.
          </p>
        </div>
      </div>

      {/* Import Interface */}
      <ImportClient organizationId={user.organizationId} />
    </div>
  );
}
