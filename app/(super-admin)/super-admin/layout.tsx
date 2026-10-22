import { ReactNode } from "react";
import { requireSuperAdmin } from "@/lib/tenant/context";
import { SuperAdminSidebar } from "@/components/super-admin/layout/SuperAdminSidebar";
import { SuperAdminHeader } from "@/components/super-admin/layout/SuperAdminHeader";

export const metadata = {
  title: "UNI-PAY — الإدارة المركزية الوطنية",
  description: "منصة تسيير أجور الجامعات الجزائرية — الإشراف المركزي والحوكمة الوطنية",
};

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // الحماية الصارمة لجميع مسارات الإدارة المركزية
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans" dir="rtl">
      {/* الشريط الجانبي المركزي RTL */}
      <SuperAdminSidebar user={user} />

      {/* منطقة المحتوى الرئيسية */}
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
