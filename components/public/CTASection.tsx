import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function CTASection() {
  return (
    <section
      className="bg-uni-navy section-padding"
      aria-label="ابدأ باستخدام UNI-PAY"
    >
      <div className="container-uni">
        <div className="max-w-2xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            ابدأ باستخدام UNI-PAY
          </h2>

          {/* Description */}
          <p className="text-white/70 text-base leading-relaxed mb-8">
            الوصول إلى منصة UNI-PAY يتم عبر حساب مؤسسي مصرح به.
            تواصل مع المسؤول الإداري للحصول على بيانات الدخول.
          </p>

          {/* CTA Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white text-uni-navy font-semibold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] focus-ring"
          >
            <ChevronLeft className="h-4 w-4 icon-rtl" aria-hidden="true" />
            تسجيل الدخول
          </Link>

          {/* Note */}
          <p className="mt-6 text-white/40 text-xs">
            لا تتوفر إمكانية التسجيل المستقل — الوصول عبر الحسابات المؤسسية فقط
          </p>
        </div>
      </div>
    </section>
  );
}
