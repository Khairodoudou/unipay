import Link from "next/link";
import { Users, KeyRound, ArrowLeft, ShieldCheck } from "lucide-react";

interface RoleCard {
  id: string;
  code: string;
  nameAr: string;
  descriptionAr: string | null;
  _count: {
    users: number;
    rolePermissions: number;
  };
}

interface RolesGridProps {
  roles: RoleCard[];
}

export function RolesGrid({ roles }: RolesGridProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {roles.map((role) => {
        const isAdmin = role.code === "ADMIN";
        return (
          <div
            key={role.id}
            className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between ${
              isAdmin
                ? "border-teal-200/90 shadow-md ring-1 ring-teal-500/10"
                : "border-slate-200 shadow-2xs hover:border-slate-300"
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                    isAdmin
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>

                <code className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                  {role.code}
                </code>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                {role.nameAr}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6">
                {role.descriptionAr || "دور نظام معتمد في المنصة."}
              </p>
            </div>

            {/* Bottom Meta & Link */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>المستخدمون :</span>
                  <strong className="text-slate-900 font-mono">
                    {role._count.users}
                  </strong>
                </span>

                <span className="flex items-center gap-1.5 text-slate-500">
                  <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                  <span>الصلاحيات :</span>
                  <strong className="text-teal-700 font-mono">
                    {role._count.rolePermissions}
                  </strong>
                </span>
              </div>

              <Link
                href={`/admin/roles/${role.id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 hover:border-teal-200 transition-all focus-ring"
              >
                <span>معاينة الصلاحيات والمستخدمين</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
