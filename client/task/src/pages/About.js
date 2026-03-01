import React from "react";
import "./About.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");
  const handleGetStarted = () => navigate(isAuthenticated ? "/home" : "/register");

  return (
    <div className="about-page">

      {/* ── HERO ── */}
      <section className="ab-hero">
        {/* Floating SVG orb */}
        <svg className="ab-orb ab-orb-1" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="og1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="100" ry="100" fill="url(#og1)" />
        </svg>
        <svg className="ab-orb ab-orb-2" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="og2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="100" ry="100" fill="url(#og2)" />
        </svg>

        <motion.div
          className="ab-hero-text"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="ab-badge">Our Story</span>
          <h1>Built by developers,<br /><span>for developers</span></h1>
          <p>We got tired of documentation being the last thing on every sprint. So we automated it.</p>
        </motion.div>

        {/* SVG illustration */}
        <motion.div
          className="ab-hero-svg"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
        >
          <svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" className="ab-illustration">
            <defs>
              <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e2a45" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Left Box: Code Repository */}
            <rect x="20" y="100" width="110" height="100" rx="12" fill="url(#boxGrad)" stroke="#334155" strokeWidth="2" />
            <text x="75" y="130" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600" letterSpacing="1">CODEBASE</text>
            <rect x="40" y="145" width="70" height="4" rx="2" fill="#3b82f6" />
            <rect x="40" y="157" width="50" height="4" rx="2" fill="#64748b" />
            <rect x="40" y="169" width="60" height="4" rx="2" fill="#64748b" />

            {/* Connecting Line 1 */}
            <path d="M 130 150 L 190 150" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
            <polygon points="185,145 195,150 185,155" fill="#475569" />

            {/* Center Box: DocufyAi Engine */}
            <rect x="195" y="90" width="130" height="120" rx="16" fill="url(#aiGrad)" style={{ filter: "drop-shadow(0 10px 15px rgba(99,102,241,0.3))" }} />
            <circle cx="260" cy="140" r="24" fill="rgba(255,255,255,0.2)" />
            <text x="260" y="146" textAnchor="middle" fill="#ffffff" fontSize="20">✨</text>
            <text x="260" y="185" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" letterSpacing="1">AI ENGINE</text>

            {/* Connecting Line 2 */}
            <path d="M 325 150 L 385 150" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
            <polygon points="380,145 390,150 380,155" fill="#475569" />

            {/* Right Box: Documentation */}
            <rect x="390" y="80" width="90" height="140" rx="12" fill="url(#boxGrad)" stroke="#334155" strokeWidth="2" />
            <text x="435" y="105" textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="bold" letterSpacing="1">DOCS</text>
            <rect x="405" y="120" width="60" height="4" rx="2" fill="#8b5cf6" />
            <rect x="405" y="132" width="40" height="4" rx="2" fill="#64748b" />
            <rect x="405" y="144" width="50" height="4" rx="2" fill="#64748b" />
            <rect x="405" y="162" width="55" height="4" rx="2" fill="#3b82f6" />
            <rect x="405" y="174" width="45" height="4" rx="2" fill="#64748b" />
            <rect x="405" y="192" width="60" height="4" rx="2" fill="#8b5cf6" />
            <rect x="405" y="204" width="30" height="4" rx="2" fill="#64748b" />
          </svg>
        </motion.div>
      </section>

      {/* ── MISSION CARDS ── */}
      <section className="ab-mission">
        {[
          {
            icon: (
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="ab-card-icon">
                <rect width="48" height="48" rx="12" fill="rgba(99,102,241,0.12)" />
                <path d="M14 18h20M14 24h14M14 30h18" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
                <circle cx="36" cy="30" r="6" fill="none" stroke="#6366f1" strokeWidth="2" />
                <path d="m33 30 2 2 3-3" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            title: "Zero Manual Docs",
            desc: "Connect a GitHub repo and our AI reads every function, class, and endpoint — generating clear, structured documentation in minutes."
          },
          {
            icon: (
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="ab-card-icon">
                <rect width="48" height="48" rx="12" fill="rgba(99,102,241,0.12)" />
                <path d="M24 14v6m0 8v6M14 24h6m8 0h6" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="24" r="4" stroke="#6366f1" strokeWidth="2" />
              </svg>
            ),
            title: "Always In Sync",
            desc: "Push new code? DocufyAi detects the changes and updates your docs automatically, so they never fall behind your codebase."
          },
          {
            icon: (
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="ab-card-icon">
                <rect width="48" height="48" rx="12" fill="rgba(99,102,241,0.12)" />
                <path d="M16 32V20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12l-4-2-4 2-4-2-4 2Z" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round" />
                <path d="M20 24h8M20 28h5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ),
            title: "Chat With Your Docs",
            desc: "Ask questions about your codebase in plain English. Our AI assistant gives contextual answers powered by your own generated docs."
          }
        ].map((card, i) => (
          <motion.div
            key={i}
            className="ab-card"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            whileHover={{ y: -6 }}
          >
            {card.icon}
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="ab-timeline-section">
        <div className="ab-section-label">Workflow</div>
        <h2 className="ab-section-title">How DocufyAi Works</h2>

        <div className="ab-timeline">
          {[
            {
              step: "01",
              title: "Connect Your Repository",
              desc: "Securely link your GitHub account. Select the repositories you want documented. We establish a read-only connection to analyze your codebase instantly.",
              color: "#6366f1"
            },
            {
              step: "02",
              title: "AI Analysis & Processing",
              desc: "Our advanced LLM engine scans your directory structure, parses complex logic, and understands the relationships between your components, APIs, and utilities.",
              color: "#8b5cf6"
            },
            {
              step: "03",
              title: "Publish & Auto-Sync",
              desc: "Get a beautifully formatted, comprehensive documentation site. Every time your team pushes new code to the main branch, your docs are automatically regenerated and kept in perfect sync.",
              color: "#22d3ee"
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              className="ab-timeline-item"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="ab-timeline-dot" style={{ background: item.color, boxShadow: `0 0 12px ${item.color}` }} />
              <div className="ab-timeline-content">
                <span className="ab-timeline-year" style={{ color: item.color }}>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ab-cta">
        {/* Background SVG dots decoration */}
        <svg className="ab-cta-bg" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 12 }).map((_, i) =>
            Array.from({ length: 6 }).map((__, j) => (
              <circle key={`${i}-${j}`} cx={50 * i} cy={34 * j} r="1.5" fill="#6366f1" opacity={0.15 + (i + j) % 3 * 0.08} />
            ))
          )}
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Ready to automate your docs?</h2>
          <p>Join developers who've shipped better documentation with zero manual effort.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="ab-cta-btn"
            onClick={handleGetStarted}
          >
            Get Started Free →
          </motion.button>
        </motion.div>
      </section>

    </div>
  );
};

export default About;
