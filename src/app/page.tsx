
"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Users,
  CalendarDays,
  Network,
  Zap,
  ShieldCheck,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const modules = [
  {
    name: "KRIYALAYA Connect",
    code: "01 / COMMUNICATION",
    description:
      "Bring students, teachers and coordinators together through intelligent communities and real-time communication.",
    icon: Network,
    color: "green",
  },
  {
    name: "KRIYALAYA Flow",
    code: "02 / REGISTRATION",
    description:
      "Create dynamic registrations, manage participants and simplify every activity workflow.",
    icon: CalendarDays,
    color: "burgundy",
  },
  {
    name: "KRIYALAYA Ops",
    code: "03 / OPERATIONS",
    description:
      "Coordinate teams, invitations, venues, resources and assignments from one command center.",
    icon: Users,
    color: "gold",
  },
  {
    name: "KRIYALAYA AI",
    code: "04 / INTELLIGENCE",
    description:
      "Make smarter activity decisions with intelligent recommendations and planning assistance.",
    icon: Sparkles,
    color: "burgundy",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Hidden admin shortcut: five clicks on the main logo within three seconds.
  const logoClicks = useRef(0);
  const logoResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (logoResetTimer.current) {
        clearTimeout(logoResetTimer.current);
      }
    };
  }, []);

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    logoClicks.current += 1;

    if (logoResetTimer.current) {
      clearTimeout(logoResetTimer.current);
      logoResetTimer.current = null;
    }

    if (logoClicks.current >= 5) {
      logoClicks.current = 0;
      router.push("/admin/login");
      return;
    }

    logoResetTimer.current = setTimeout(() => {
      logoClicks.current = 0;
      logoResetTimer.current = null;
    }, 3000);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#FDFBF7] text-[#2B1E1F]">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
        <a
          href="#"
          onClick={handleLogoClick}
          className="flex items-center gap-3"
          aria-label="KRIYALAYA home"
        >
          <div className="logo-mark">K</div>
          <div>
            <div className="text-lg font-bold tracking-[0.16em] lg:text-xl">
              KRIYALAYA
            </div>
            <div className="text-[9px] tracking-[0.25em] text-[#81796E]">
              OMNIA FLUENTIA
            </div>
          </div>
        </a>

        <div className="hidden items-center gap-9 text-sm text-[#2B1E1F] md:flex">
          <a href="#home" className="nav-link">Home</a>
          <a href="#platform" className="nav-link">Platform</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a href="#platform" className="text-sm text-[#2B1E1F]">
            Explore
          </a>
          <a href="#contact" className="primary-button">
            Get Started <ArrowRight size={15} />
          </a>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        {menuOpen && (
          <div className="absolute left-0 right-0 top-20 z-30 mx-5 rounded-2xl border border-[#E5DEC9] bg-[#0F4933] p-6 text-[#FDFBF7] shadow-2xl md:hidden">
            <div className="flex flex-col gap-5 text-sm">
              <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
              <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
              <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
              <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
            </div>
          </div>
        )}
      </nav>

      <section
        id="home"
        className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-28 pt-20 lg:grid-cols-2 lg:px-12 lg:pt-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#EAF0E8] px-4 py-2 text-xs tracking-wider text-[#0F4933]">
            <span className="h-2 w-2 rounded-full bg-[#C5A059] shadow-[0_0_12px_#C5A059]" />
            THE FUTURE OF CAMPUS COLLABORATION
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
            The Intelligence
            <br />
            of <span className="gradient-text">Connection.</span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-8 text-[#81796E] sm:text-lg">
            One intelligent ecosystem. Every student. Every educator.
            Every activity. Connect people, coordinate experiences
            and create extraordinary campus moments.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#platform" className="primary-button">
              Explore KRIYALAYA <ArrowRight size={17} />
            </a>
            <a href="#about" className="secondary-button">
              Discover the platform
            </a>
          </div>

          <div className="mt-16 flex flex-wrap gap-8 border-t border-[#E5DEC9] pt-8">
            <div>
              <div className="text-2xl font-semibold">01</div>
              <div className="mt-1 text-xs text-[#81796E]">Unified ecosystem</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">04</div>
              <div className="mt-1 text-xs text-[#81796E]">Core modules</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">∞</div>
              <div className="mt-1 text-xs text-[#81796E]">Possibilities</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />

          <div className="relative flex aspect-square items-center justify-center">
            <div className="absolute inset-[12%] rounded-full border border-[#C5A059]/30" />
            <div className="absolute inset-[22%] rounded-full border border-[#5A1827]/25" />
            <div className="absolute inset-[32%] rounded-full bg-[#C5A059]/15 blur-3xl" />

            <div className="hero-emblem">
              <span>K</span>
            </div>

            <div className="absolute left-0 top-[22%] glass-chip">
              <Network size={18} className="text-[#5A1827]" />
              <span>CONNECT</span>
            </div>

            <div className="absolute right-0 top-[32%] glass-chip">
              <Sparkles size={18} className="text-[#C5A059]" />
              <span>INTELLIGENCE</span>
            </div>

            <div className="absolute bottom-[20%] left-[12%] glass-chip">
              <Users size={18} className="text-[#0F4933]" />
              <span>COMMUNITY</span>
            </div>

            <div className="absolute bottom-[12%] right-[8%] glass-chip">
              <Zap size={18} className="text-[#5A1827]" />
              <span>COLLABORATE</span>
            </div>
          </div>

          <div className="text-center text-xs tracking-[0.45em] text-[#81796E]">
            CONNECT · COORDINATE · CREATE
          </div>
        </motion.div>
      </section>

      <section id="platform" className="relative z-10 border-t border-[#E5DEC9] bg-[#F3EFE5] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="section-label">THE KRIYALAYA ECOSYSTEM</div>
              <h2 className="mt-4 text-3xl font-semibold sm:text-5xl">
                One platform. <span className="gradient-text">Infinite possibilities.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#81796E]">
              A connected digital environment designed to transform
              the way educational institutions organize and experience activities.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <motion.div
                  key={module.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`module-card module-${module.color}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="module-icon">
                      <Icon size={23} />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] text-[#81796E]">
                      {module.code}
                    </span>
                  </div>

                  <h3 className="mt-8 text-2xl font-semibold">
                    {module.name}
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[#81796E]">
                    {module.description}
                  </p>
                  <div className="mt-7 flex items-center gap-2 text-sm text-[#0F4933]">
                    Explore module <ArrowRight size={15} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="about" className="relative z-10 px-6 py-24 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <div className="section-label">A NEW WAY TO COLLABORATE</div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
              More than an event platform.
              <br />
              <span className="gradient-text">A connected campus.</span>
            </h2>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <ShieldCheck className="mt-1 shrink-0 text-[#5A1827]" />
              <div>
                <h3 className="font-semibold">One unified experience</h3>
                <p className="mt-2 text-sm leading-7 text-[#81796E]">
                  Bring activity discovery, registration, communication
                  and coordination together.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <GraduationCap className="mt-1 shrink-0 text-[#C5A059]" />
              <div>
                <h3 className="font-semibold">Designed for education</h3>
                <p className="mt-2 text-sm leading-7 text-[#81796E]">
                  Connect students, staff, coordinators and administrators
                  around shared experiences.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Sparkles className="mt-1 shrink-0 text-[#0F4933]" />
              <div>
                <h3 className="font-semibold">Built to evolve</h3>
                <p className="mt-2 text-sm leading-7 text-[#81796E]">
                  An extensible platform for sports, exhibitions,
                  festivals and future campus activities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="relative z-10 border-t border-[#E5DEC9] px-6 py-10 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="logo-mark small-logo">K</div>
            <span className="font-bold tracking-[0.18em]">KRIYALAYA</span>
            <span className="text-[9px] tracking-[0.25em] text-[#81796E]">
              OMNIA FLUENTIA
            </span>
          </div>
          <p className="text-xs text-[#81796E]">
            A unified intelligence ecosystem for educational institutions.
          </p>
          <p className="text-xs text-[#81796E]">
            © 2026 KRIYALAYA. Connect. Coordinate. Create.
          </p>
        </div>
      </footer>
    </main>
  );
}
