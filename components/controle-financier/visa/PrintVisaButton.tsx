"use client";

import { Printer } from "lucide-react";

export function PrintVisaButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] print:hidden cursor-pointer"
      title="طباعة بطاقة التأشيرة أو حفظها بصيغة PDF"
    >
      <Printer className="w-4 h-4 text-amber-400" />
      <span>طباعة الوثيقة الرسمية / تصدير PDF</span>
    </button>
  );
}
