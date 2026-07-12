import Nav from "./Nav";
import Hero from "./Hero";
import Features from "./Features";
import Roles from "./Roles";
import Footer from "./Footer";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-mist-200 font-sans text-ink-900 antialiased">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Roles />
      </main>
      <Footer />
    </div>
  );
}
