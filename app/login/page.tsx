import type { Metadata } from "next";
import LoginForm from "@/components/public/LoginForm";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "الوصول إلى منصة UNI-PAY عبر حسابك المؤسسي.",
};

export default function LoginPage() {
  return <LoginForm />;
}
