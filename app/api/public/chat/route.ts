import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, PREFERRED_GEMINI_MODELS } from "@/lib/ai/gemini";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `
أنت "المساعد الذكي الرسمي لمنصة أكاديميا شفاف" (أكاديميا شفاف Assistant).
منصة أكاديميا شفاف هي المنصة الرقمية الوطنية المتكاملة لتسيير ومعالجة أجور موظفي وأساتذة مؤسسات التعليم العالي والبحث العلمي بالجمهورية الجزائرية الديمقراطية الشعبية.

مهامك:
1. مساعدة زوار المنصة والأساتذة والموظفين الإداريين والتقنيين والمسؤولين في فهم خصائص المنصة وخدماتها.
2. الإجابة بدقة وبطريقة مؤسسية راقية وواضحة (باللغة العربية، أو الفرنسية إذا تحدث المستخدم بالفرنسية، وتفهم الدارجة الجزائرية تماماً).
3. تقديم معلومات دقيقة حول:
   - مسار إعداد واعتماد الأجور: عون الموارد البشرية (Agent RH) -> رئيس المصلحة (Chef de Service) -> مدير الجامعة (Directeur) -> المحاسب المالي (Comptable) -> المراقب المالي (Contrôleur Financier) -> إطلاق الدفع البنكي وتأكيده.
   - فضاء الموظف: تحميل كشوف الراتب الشهرية الرسمية بصيغة PDF مشفرة، الاطلاع على الملف الإداري، الحسابات البنكية المحمية (RIB).
   - عناصر الأجر: الراتب الأساسي (النقطة الاستدلالية × 45 دج)، منحة الخبرة المهنية (IEP)، منحة المردودية، اقتطاع الضمان الاجتماعي CNAS (9%)، والضريبة على الدخل الإجمالي IRG وفق القانون الجزائري.
   - تسجيل الدخول والدعم: الحسابات تنشأ وتدار مركزياً عبر مصلحة الموارد البشرية ومسؤولي النظام (Admin). إعادة تعيين كلمة المرور تتطلب مراجعة إدارة شؤون المستخدمين لضمان السرية المالية.
4. إرشادات الأسلوب:
   - إجاباتك يجب أن تكون مختصرة ومفيدة (Concise & Professional).
   - استخدم التنسيق النقطي (Bullet points) والعناوين البارزة.
   - لا تفصح أبداً عن أي بيانات سرية أو مفاتيح برمجية.
   - إذا سألك المستخدم سؤالاً خارج نطاق المنصة، أجب بلطف ووجهه لما يخص منصة أكاديميا شفاف والرواتب الجامعية.
`;

// Moteur de secours intelligent si l'API externe est saturée
function getDeterministicFallback(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("كشف") || lower.includes("راتب") || lower.includes("fiche") || lower.includes("bulletin") || lower.includes("payslip")) {
    return `📄 **استخراج كشف الراتب الشهري عبر منصة أكاديميا شفاف:**

• يمكنك الاطلاع على كشف الراتب وتحميله بصيغة PDF رسمية من خلال **فضاء الموظف** (Espace Employé).
• **الخطوات:**
  1. قم بتسجيل الدخول إلى حسابك المؤسسي عبر صفحة الدخول.
  2. اختر من القائمة «**كشوف الراتب**».
  3. حدد الشهر أو السنة المطلوبة، ثم اضغط على «**تحميل PDF**».
• **ملاحظة:** لا يظهر الكشف للموظف إلا بعد حصول مسيرة الأجور على التأشيرة المالية النهائية والمصادقة.`;
  }

  if (lower.includes("دخول") || lower.includes("كلمة المرور") || lower.includes("mot de passe") || lower.includes("login") || lower.includes("connexion") || lower.includes("نسيت")) {
    return `🔐 **الولوج واسترجاع بيانات الدخول:**

• **إنشاء الحسابات:** يتم حصرياً عبر **مصلحة الموارد البشرية** أو مسؤول النظام (Admin) بجامعتك.
• **استرجاع كلمة المرور:** نظراً للسرية والضوابط المالية الصارمة، يتم إعادة تعيين كلمات المرور مباشرة عبر إدارة شؤون المستخدمين بالجامعة وليس عبر البريد الشخصي غير الموثق.
• إذا كنت موظفاً ولديك حساب مفعل، تأكد من إدخال بريدك المؤسسي وكلمة المرور المسلّمة لك بدقة.`;
  }

  if (lower.includes("دور") || lower.includes("أدوار") || lower.includes("صلاحيات") || lower.includes("role") || lower.includes("من يستعمل")) {
    return `👥 **الأدوار المؤسسية في منصة أكاديميا شفاف:**

1. **عون الموارد البشرية (Agent RH):** إعداد مسيرة الرواتب الشهرية ومتابعة الحضور والغيابات.
2. **رئيس المصلحة (Chef de Service):** التدقيق الأولي والمصادقة على عناصر الأجر.
3. **مدير الجامعة (Directeur):** الاعتماد النهائي وتفويض العمليات.
4. **المحاسب المالي (Comptable):** التدقيق المحاسبي وإعداد وتأكيد أوامر الصرف المالي.
5. **المراقب المالي (Contrôleur Financier):** فحص المشروعية ومنح التأشيرة المالية المسبقة (Visa).
6. **الموظف (Employé):** فضاء شخصي للاطلاع على كشوف الرواتب والشهادات الإدارية.
7. **مدير النظام (Admin):** إدارة المستخدمين والصلاحيات وهيكل المؤسسة.`;
  }

  if (lower.includes("irg") || lower.includes("cnas") || lower.includes("ضمان") || lower.includes("ضريبة") || lower.includes("حساب") || lower.includes("calcul")) {
    return `🧮 **قواعد الحساب المالي في منصة أكاديميا شفاف:**

• المنصة مبرمجة ومضبوطة وفقاً للتشريع المالي الجزائري وقوانين الوظيف العمومي:
  - **الراتب الأساسي:** محسوب على أساس النقطة الاستدلالية (قيمة النقطة = 45 دج).
  - **الضمان الاجتماعي (CNAS):** اقتطاع قانوني بنسبة **9%** من الأجر الخاضع للاشتراك.
  - **ضريبة الدخل الإجمالي (IRG):** احتساب آلي وفق السلم التدريجي المعتمد (مع إعفاء الأجور أقل من 30,000 دج وتطبيق التخفيضات القانونية).
  - **المنح والعلاوات:** حساب دقيق لمنحة الخبرة المهنية (IEP)، منحة المردودية والتعويضات النظامية.`;
  }

  return `مرحباً بك في **منصة أكاديميا شفاف**! 🎓

أنا مساعدك الذكي للإجابة عن جميع استفساراتك حول المنصة الوطنية لتسيير رواتب قطاع التعليم العالي والبحث العلمي بالجزائر.

يمكنني مساعدتك في:
• كيفية استخراج كشوف الرواتب الشهرية بصيغة PDF الرسمية.
• شرح مسار التأشيرة والرقابة المالية والمصادقات.
• توضيح الأدوار والصلاحيات في المنصة.
• شروط حساب الضمان الاجتماعي (CNAS) وضريبة الدخل (IRG).

كيف يمكنني خدمتك اليوم؟`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "الرجاء إدخال نص السؤال." },
        { status: 400 }
      );
    }

    if (message.length > 800) {
      return NextResponse.json(
        { error: "الرسالة طويلة جداً، يرجى اختصار السؤال إلى أقل من 800 حرف." },
        { status: 400 }
      );
    }

    // Historique optionnel (max 6 derniers messages)
    const history = Array.isArray(body.history)
      ? body.history.slice(-6).map((item: any) => ({
          role: item.role === "user" ? "user" : "model",
          text: String(item.content || "").slice(0, 500),
        }))
      : [];

    let reply = "";

    // Tentative d'appel Gemini avec nos modèles prioritaires vérifiés
    try {
      const client = getGeminiClient();

      for (const model of PREFERRED_GEMINI_MODELS) {
        try {
          const contents = [
            {
              role: "user",
              parts: [{ text: `${SYSTEM_PROMPT}\n\nسياق المحادثة السابقة إن وجد:\n${JSON.stringify(history)}` }],
            },
            {
              role: "model",
              parts: [{ text: "فهمت تعليمات الهوية المؤسسية لمنصة أكاديميا شفاف وسأجيب بدقة واحترافية وفق الأنظمة الجزائرية." }],
            },
            {
              role: "user",
              parts: [{ text: message }],
            },
          ];

          const response = await Promise.race([
            client.models.generateContent({
              model,
              contents,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 7000)
            ),
          ]);

          const textResult = (response as any)?.text || (response as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResult && typeof textResult === "string" && textResult.trim().length > 0) {
            reply = textResult.trim();
            break;
          }
        } catch (modelErr) {
          console.warn(`[PublicChatbot] Modèle ${model} non disponible, passage au suivant...`, modelErr);
          continue;
        }
      }
    } catch (clientErr) {
      console.warn("[PublicChatbot] Client Gemini non disponible, basculement déterministe:", clientErr);
    }

    // Si Gemini n'a pas répondu ou a échoué, utiliser le moteur de secours déterministe
    if (!reply) {
      reply = getDeterministicFallback(message);
    }

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PublicChatbot API Error]:", error);
    return NextResponse.json({
      success: true,
      reply: getDeterministicFallback(""),
      timestamp: new Date().toISOString(),
    });
  }
}
