import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Hero from "@/components/public/Hero";
import AboutSection from "@/components/public/AboutSection";
import FeaturesSection from "@/components/public/FeaturesSection";
import WorkflowSection from "@/components/public/WorkflowSection";
import SecuritySection from "@/components/public/SecuritySection";
import RolesSection from "@/components/public/RolesSection";
import CTASection from "@/components/public/CTASection";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "UNI-PAY — منصة تسيير أجور موظفي الجامعة",
  description:
    "UNI-PAY منصة رقمية متكاملة لتسيير ومعالجة أجور موظفي الجامعة — إعداد، تدقيق، مصادقة، رقابة ومتابعة.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <AboutSection />
        <FeaturesSection />
        <WorkflowSection />
        <SecuritySection />
        <RolesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
