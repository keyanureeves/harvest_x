"use client";

import Link from "next/link";
import {
  ChevronRight,
  Leaf,
  Zap,
  Globe,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Page configuration: edit copy, links and numbers here               */
/* ------------------------------------------------------------------ */

const BRAND = "HarvestX";
const APP_HREF = "/dashboard";
const TOKEN = "HarvestX"; // rename here if the token name changes

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
  { label: "Benefits", href: "#benefits" },
];

// Placeholder numbers: replace with real data (or contract reads) later
const STATS = [
  { value: "120+", label: "Active Farmers", color: "text-primary" },
  { value: "25K", label: "KG Processed", color: "text-secondary" },
  { value: "10K", label: "CO₂ Saved", color: "text-primary" },
];

const STEPS = [
  {
    title: "Register & Verify",
    body: "Join our platform and complete farm verification. Gain instant access to processing tools and real-time carbon tracking dashboards.",
  },
  {
    title: "Process Waste",
    body: "Convert organic waste through sustainable methods. Every kilogram processed is recorded on-chain with full transparency and verification.",
  },
  {
    title: "Earn Tokens",
    body: `Receive ${TOKEN} tokens instantly for processing milestones. Tokens represent real environmental impact and can be traded or held.`,
  },
  {
    title: "Monetize Impact",
    body: "Trade tokenized carbon credits on our marketplace. Unlock multiple revenue streams through corporate offset programs.",
  },
];

// Full class strings are kept here so Tailwind can detect them
const FEATURES = [
  {
    icon: Zap,
    title: "Tokenized Carbon Credits",
    body: "Convert verified CO₂ reductions into tradable tokens. Each credit represents real environmental impact with blockchain verification.",
    card: "hover:border-primary",
    iconWrap: "bg-primary/10 group-hover:bg-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Multi-Stream Earnings",
    body: "Generate revenue from processing fees, token rewards, and carbon credit sales. Multiple income sources from a single waste input.",
    card: "hover:border-secondary",
    iconWrap: "bg-secondary/10 group-hover:bg-secondary/20",
    iconColor: "text-secondary",
  },
  {
    icon: Globe,
    title: "Complete Transparency",
    body: "Real-time dashboards showing waste processed, emissions saved, and earnings. All metrics verified on-chain for complete trust.",
    card: "hover:border-primary",
    iconWrap: "bg-primary/10 group-hover:bg-primary/20",
    iconColor: "text-primary",
  },
];

const IMPACT = [
  {
    value: "120+",
    title: "Registered Farmers",
    body: "Growing network of sustainable producers",
    color: "text-primary",
  },
  {
    value: "25K",
    title: "KG Processed",
    body: "Organic waste converted to value",
    color: "text-secondary",
  },
  {
    value: "10K",
    title: "KG CO₂ Saved",
    body: "Emissions prevented, planet restored",
    color: "text-primary",
  },
];

const BENEFITS = [
  {
    icon: Leaf,
    title: "Blockchain Verified",
    body: "Every transaction and waste process is recorded on-chain for complete transparency and security.",
    iconWrap: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Instant Rewards",
    body: `Get paid in ${TOKEN} tokens immediately upon processing verification. No delays, no middlemen.`,
    iconWrap: "bg-secondary/10",
    iconColor: "text-secondary",
  },
  {
    icon: Globe,
    title: "Global Marketplace",
    body: "Trade carbon credits with corporate buyers worldwide. Expand your revenue potential internationally.",
    iconWrap: "bg-primary/10",
    iconColor: "text-primary",
  },
];

const METERS = [
  {
    label: "Earning Potential",
    display: "+250%",
    width: "85%",
    text: "text-primary",
    bar: "bg-primary",
  },
  {
    label: "Environmental Impact",
    display: "+340%",
    width: "95%",
    text: "text-secondary",
    bar: "bg-secondary",
  },
  {
    label: "User Satisfaction",
    display: "98%",
    width: "98%",
    text: "text-primary",
    bar: "bg-primary",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Launch App", href: APP_HREF, internal: true },
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Twitter", href: "https://twitter.com", external: true },
      { label: "Discord", href: "https://discord.com", external: true },
      { label: "GitHub", href: "https://github.com", external: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background font-sans">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">{BRAND}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-secondary pb-1 border-b-2 border-b-transparent hover:border-b-secondary transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Open App Button */}
          <div className="flex items-center gap-3">
            <Link
              href={APP_HREF}
              className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 font-semibold text-sm group"
            >
              Open App
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <div className="px-4 py-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href={APP_HREF}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-secondary transition-all mt-4 font-semibold text-sm group w-full justify-center"
              >
                Open App
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32 lg:py-40 max-w-6xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Leaf className="w-4 h-4" />
              <span className="text-sm font-semibold">
                Waste-to-Earn Sustainability
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight text-balance">
                Turn Organic Waste Into Value
              </h1>
              <p className="text-xl md:text-2xl text-secondary max-w-3xl leading-relaxed text-balance">
                Empower farmers and processors with blockchain-verified waste
                processing, carbon credits, and tokenized rewards. Create
                environmental impact while earning real income.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link
                href={APP_HREF}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 font-semibold text-lg flex items-center gap-2 group shadow-lg hover:shadow-xl"
              >
                Open App
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#how-it-works"
                className="px-8 py-4 bg-muted text-foreground rounded-xl hover:bg-border transition-all duration-300 font-semibold text-lg border border-border"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="flex flex-wrap gap-8 md:gap-12 pt-8 md:pt-12 border-t border-border">
            {STATS.map((stat) => (
              <div key={stat.label} className="space-y-0.5">
                <div className={`text-3xl md:text-4xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-sm text-foreground font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="px-4 py-20 md:py-32 bg-secondary relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(250, 240, 230, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-foreground text-balance">
              How It Works
            </h2>
            <p className="text-lg text-secondary-foreground/90 max-w-2xl">
              A transparent, blockchain-verified system connecting farmers to
              sustainable value creation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="p-6 rounded-xl bg-secondary-foreground/10 border border-secondary-foreground/20 hover:bg-secondary-foreground/20 transition-all duration-300 space-y-4 group backdrop-blur-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold text-secondary-foreground">
                  {step.title}
                </h3>
                <p className="text-secondary-foreground/90 leading-relaxed text-sm">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 md:py-32 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
              Platform Features
            </h2>
            <p className="text-lg text-secondary max-w-2xl">
              Everything you need to transform waste into wealth and impact
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`p-6 rounded-xl bg-white border border-border ${f.card} transition-all duration-300 space-y-4 group`}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${f.iconWrap}`}
                >
                  <f.icon
                    className={`w-6 h-6 group-hover:scale-110 transition-transform ${f.iconColor}`}
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground">{f.title}</h3>
                <p className="text-foreground leading-relaxed text-sm">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="px-4 py-20 md:py-32 bg-primary">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground text-balance">
              Real Impact, Real Numbers
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Join a growing community creating environmental and economic value
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {IMPACT.map((item) => (
              <div
                key={item.title}
                className="p-8 rounded-2xl bg-primary-foreground space-y-3 text-center"
              >
                <div className={`text-5xl md:text-6xl font-bold ${item.color}`}>
                  {item.value}
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-secondary">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="px-4 py-20 md:py-32 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
              Why Choose {BRAND}
            </h2>
            <p className="text-lg text-secondary max-w-2xl">
              A complete solution for farmers, processors, and environmental
              advocates
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${b.iconWrap}`}
                  >
                    <b.icon className={`w-6 h-6 ${b.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {b.title}
                    </h3>
                    <p className="text-foreground">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-muted p-8 rounded-2xl border border-border space-y-4">
              {METERS.map((m) => (
                <div key={m.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-semibold">
                      {m.label}
                    </span>
                    <span className={`font-bold ${m.text}`}>{m.display}</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.bar}`}
                      style={{ width: m.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-24 bg-secondary">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-secondary-foreground">
            Ready to Transform Waste Into Wealth?
          </h2>
          <p className="text-lg text-secondary-foreground/90">
            Join hundreds of farmers and processors already earning from
            sustainable waste processing.
          </p>
          <Link
            href={APP_HREF}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-foreground text-primary rounded-xl hover:bg-muted transition-all duration-300 font-semibold text-lg group shadow-lg"
          >
            Get Started Now
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 md:py-16 bg-foreground text-primary-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-6 h-6" />
                <span className="text-xl font-bold">{BRAND}</span>
              </div>
              <p className="text-sm text-primary-foreground/80">
                Turning organic waste into environmental and economic value.
              </p>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="space-y-3">
                <h4 className="font-semibold">{col.title}</h4>
                <ul className="space-y-2 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {"internal" in link && link.internal ? (
                        <Link
                          href={link.href}
                          className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          {...("external" in link && link.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-foreground/70 text-sm">
              © {new Date().getFullYear()} {BRAND}. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0 text-sm">
              <a
                href="#"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
