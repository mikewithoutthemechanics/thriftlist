import Hero from '@/components/landing/Hero';
import MarqueeStrip from '@/components/landing/MarqueeStrip';
import HowItWorks from '@/components/landing/HowItWorks';
import ProblemSolution from '@/components/landing/ProblemSolution';
import Features from '@/components/landing/Features';
import MotionCarousel from '@/components/landing/MotionCarousel';
import SocialProof from '@/components/landing/SocialProof';
import StatsCounter from '@/components/landing/StatsCounter';
import InteractiveCards from '@/components/landing/InteractiveCards';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';
import StickyCTA from '@/components/landing/StickyCTA';

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground scroll-smooth">
      <Hero />
      <MarqueeStrip />
      <ProblemSolution />
      <HowItWorks />
      <StatsCounter />
      <Features />
      <MotionCarousel />
      <InteractiveCards />
      <SocialProof />
      <CTASection />
      <Footer />
      <StickyCTA />
    </div>
  );
}