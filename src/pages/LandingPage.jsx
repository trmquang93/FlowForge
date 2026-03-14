import { useEffect } from "react";
import { L_COLORS } from "./landing/landingTheme";
import GLOBAL_CSS from "./landing/globalCss";
import NavBar from "./landing/NavBar";
import Hero from "./landing/Hero";
import Features from "./landing/Features";
import HowItWorks from "./landing/HowItWorks";
import DemoPreview from "./landing/DemoPreview";
import Footer from "./landing/Footer";

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.12 }
    );

    const targets = document.querySelectorAll(".reveal");
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div
        className="dot-grid"
        style={{
          background: L_COLORS.bg,
          minHeight: "100vh",
          color: L_COLORS.text,
          overflowX: "hidden",
        }}
      >
        <NavBar />
        <main style={{ position: "relative", zIndex: 1 }}>
          <Hero />
          <div className="gradient-divider" />
          <Features />
          <div className="gradient-divider" />
          <HowItWorks />
          <div className="gradient-divider" />
          <DemoPreview />
        </main>
        <Footer />
      </div>
    </>
  );
}
