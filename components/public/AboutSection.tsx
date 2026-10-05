export default function AboutSection() {
  const highlights = [
    { value: "7", label: "أدوار وظيفية متخصصة" },
    { value: "5+", label: "مراحل مصادقة وتحقق" },
    { value: "آلي", label: "تدقيق ذكي قائم على القواعد" },
    { value: "كامل", label: "تتبع العمليات والتغييرات" },
  ];

  return (
    <section
      id="about"
      className="bg-white section-padding"
      aria-label="ما هي UNI-PAY"
    >
      <div className="container-uni">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-uni-blue text-xs font-semibold border border-blue-100 mb-4">
              حول المنصة
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-uni-navy mb-5">
              ما هي UNI-PAY؟
            </h2>
            <div className="flex flex-col gap-4 text-slate-600 text-base leading-relaxed">
              <p>
                UNI-PAY هي منصة رقمية تهدف إلى تنظيم ورقمنة دورة معالجة أجور
                موظفي الجامعة، بداية من إعداد البيانات والحساب، مروراً
                بالتدقيق والمصادقة والمراقبة المالية، وصولاً إلى متابعة الدفع
                وإتاحة كشوف الأجور للموظفين.
              </p>
              <p>
                المنصة ليست مجرد أداة حساب رواتب — بل هي نظام متكامل يُنظّم
                التعاون بين مختلف الجهات الإدارية والمالية داخل المؤسسة
                الجامعية، مع ضمان الشفافية والمراقبة والمساءلة في كل مرحلة.
              </p>
              <p>
                صُمّمت UNI-PAY خصيصاً للسياق الجامعي الجزائري، مع مراعاة
                الهياكل الإدارية والمتطلبات التنظيمية للمؤسسات العمومية.
              </p>
            </div>
          </div>

          {/* Highlights grid */}
          <div className="grid grid-cols-2 gap-4">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-uni-bg border border-border"
              >
                <span className="text-3xl font-bold text-uni-navy mb-2">
                  {item.value}
                </span>
                <span className="text-sm text-slate-500 leading-snug">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
