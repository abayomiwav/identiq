import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Audiences } from "@/components/marketing/audiences";
import { Features } from "@/components/marketing/features";
import { Faq } from "@/components/marketing/faq";
import { CtaSection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Audiences />
        <Features />
        <Faq />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
