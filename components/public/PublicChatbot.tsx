"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Bot,
  X,
  Send,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  ChevronDown,
  ArrowUpLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: "📄 كيف أستخرج كشف الراتب؟", query: "كيف يمكنني الاطلاع على كشف الراتب وتحميله بصيغة PDF؟" },
  { label: "👥 ما هي الأدوار في المنصة؟", query: "ما هي الأدوار والصلاحيات المختلفة في منصة أكاديميا شفاف؟" },
  { label: "🔑 نسيت بيانات الدخول", query: "كيف يمكنني استرجاع كلمة المرور أو الدخول إلى حسابي؟" },
  { label: "🧮 كيف يُحسب الضمان الاجتماعي و IRG؟", query: "كيف يتم حساب اقتطاع الضمان الاجتماعي CNAS وضريبة الدخل IRG في المنصة؟" },
];

export default function PublicChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Détecter si on est sur une page externe / publique
  // Masquer le chatbot dans les espaces d'administration ou de travail internes
  const isInternalWorkspace =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/chef") ||
    pathname?.startsWith("/comptable") ||
    pathname?.startsWith("/directeur") ||
    pathname?.startsWith("/controle-financier") ||
    pathname?.startsWith("/employe") ||
    pathname?.startsWith("/super-admin");

  // Défilement automatique vers le bas à chaque nouveau message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Initialisation du message de bienvenue institutionnel
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-msg",
          role: "assistant",
          content: `مرحباً بك في **منصة أكاديميا شفاف**! 🎓

أنا **المساعد الذكي الرسمي** للمنصة الوطنية لتسيير رواتب قطاع التعليم العالي والبحث العلمي بالجزائر.

يسعدني إرشادك والإجابة عن جميع استفساراتك حول المنصة، خدمات فضاء الموظف، ومسار المصادقة والتأشيرة المالية.`,
          timestamp: new Date().toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [messages.length]);

  if (isInternalWorkspace) {
    return null;
  }

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessageId = "msg-" + Date.now();
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4).map((m) => ({
            role: m.role === "user" ? "user" : "model",
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const botReply = data?.reply || "عذراً، حدث خطأ مؤقت في الاتصال. يرجى إعادة المحاولة.";

      const newBotMessage: ChatMessage = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: botReply,
        timestamp: new Date().toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, newBotMessage]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      console.error("Chatbot Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "تعذر الاتصال بخادم الذكاء الاصطناعي حالياً. يمكنك تصفح دليل المنصة أو مراجعة مصلحة المستخدمين.",
          timestamp: new Date().toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleResetChat() {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: `تم بدء محادثة جديدة. مرحباً بك! كيف يمكنني مساعدتك في كل ما يتعلق بمنصة أكاديميا شفاف؟`,
        timestamp: new Date().toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Rendu Markdown simplifié pour le texte gras et les puces
  function renderFormattedContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // Titre ou gras markdown **texte**
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        return (
          <div
            key={index}
            className="flex items-start gap-1.5 my-1 pr-1 text-slate-800"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }

      if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }

      return (
        <p
          key={index}
          className="my-1 leading-relaxed text-slate-800"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 font-sans" dir="rtl">
      {/* ── 1. BOUTON FLOTTANT D'OUVERTURE ─────────────────────────────────── */}
      {!isOpen && (
        <div className="relative group animate-fade-in">
          {/* Badge indicateur de présence d'IA */}
          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 border border-white/30">
            <Sparkles className="w-2.5 h-2.5" />
            <span>مساعد ذكي</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="فتح المساعد الذكي أكاديميا شفاف"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-2xl transition-all duration-300",
              "bg-gradient-to-l from-slate-950 via-[#0b1528] to-blue-950 hover:to-blue-900 border border-blue-400/30 hover:border-blue-400/60",
              "hover:scale-105 active:scale-95 cursor-pointer shadow-blue-950/40"
            )}
          >
            {/* Icône animée */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-inner">
              <Bot className="w-4 h-4" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>المساعد الذكي</span>
                <span className="text-[10px] text-teal-300 font-mono">أكاديميا شفاف</span>
              </p>
              <p className="text-[10px] text-slate-300 leading-tight">استفسارات الرواتب والمنصة</p>
            </div>
          </button>
        </div>
      )}

      {/* ── 2. FENÊTRE PRINCIPALE DU CHATBOT ──────────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-x-2 bottom-3 sm:inset-auto sm:bottom-5 sm:left-5",
            "w-auto sm:w-[410px] max-w-[calc(100vw-1rem)] h-[84vh] sm:h-[600px] max-h-[680px]",
            "bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden",
            "animate-in fade-in slide-in-from-bottom-6 duration-300 z-50"
          )}
        >
          {/* ── EN-TÊTE DU CHATBOT (INSTITUTIONNEL & MODERNE) ── */}
          <div className="bg-gradient-to-l from-slate-950 via-[#0b1528] to-blue-950 text-white p-4 relative overflow-hidden flex items-center justify-between shadow-md border-b border-blue-900/40">
            {/* Motif ambiant d'arrière-plan */}
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-blue-600/15 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight text-white">المساعد الذكي أكاديميا شفاف</h3>
                  <span className="px-1.5 py-0.2 rounded-md bg-teal-400/20 text-teal-300 text-[9px] font-mono font-bold border border-teal-400/30">
                    AI DZ
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>متصل • استشارات رواتب قطاع التعليم العالي</span>
                </p>
              </div>
            </div>

            {/* Actions de l'en-tête */}
            <div className="flex items-center gap-1 relative z-10">
              <button
                type="button"
                onClick={handleResetChat}
                title="بدء محادثة جديدة"
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="إغلاق المحادثة"
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── CORPS DE LA CONVERSATION ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-slate-50/70 to-slate-100/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[86%]",
                  msg.role === "user" ? "mr-auto items-end" : "ml-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs relative group",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-xs shadow-blue-600/20"
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-2xs"
                  )}
                >
                  {msg.role === "assistant" ? renderFormattedContent(msg.content) : msg.content}

                  {/* Bouton de copie pour les réponses de l'assistant */}
                  {msg.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                      title="نسخ الإجابة"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 px-1 mt-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}

            {/* Indicateur de saisie IA */}
            {isLoading && (
              <div className="flex flex-col ml-auto items-start max-w-[85%] animate-fade-in">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 rounded-bl-xs flex items-center gap-2 text-xs text-slate-600 shadow-2xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">المساعد يقوم بالصياغة...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── SUGGESTIONS DE QUESTIONS RAPIDES ── */}
          {messages.length <= 3 && !isLoading && (
            <div className="p-2.5 bg-white border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1.5 px-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-blue-600" />
                <span>أسئلة شائعة يمكنك النقر عليها:</span>
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt.query)}
                    className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ZONE DE SAISIE & ENVOI ── */}
          <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اكتب استفسارك هنا (مثال: كيف أطبع الكشف؟)..."
                disabled={isLoading}
                maxLength={800}
                className={cn(
                  "flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900",
                  "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                )}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className={cn(
                  "p-2.5 rounded-xl text-white transition-all flex items-center justify-center cursor-pointer shadow-sm",
                  inputMessage.trim() && !isLoading
                    ? "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/30"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                )}
                title="إرسال"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>إجابات إرشادية موثوقة مستندة إلى تشريعات قطاع التعليم العالي</span>
              </span>
              <span className="hidden sm:inline font-mono">{inputMessage.length}/800</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
