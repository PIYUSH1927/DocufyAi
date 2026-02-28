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
          <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" className="ab-illustration">
            <defs>
              <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e2a45" />
                <stop offset="100%" stopColor="#111827" />
              </linearGradient>
              <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            {/* Main card */}
            <rect x="40" y="40" width="400" height="280" rx="20" fill="url(#cardGrad)" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
            {/* Top accent bar */}
            <rect x="40" y="40" width="400" height="3" rx="2" fill="url(#accentGrad)" />
            {/* Code lines */}
            <rect x="72" y="80" width="120" height="8" rx="4" fill="#6366f1" opacity="0.7" />
            <rect x="72" y="100" width="240" height="6" rx="3" fill="#334155" />
            <rect x="72" y="116" width="200" height="6" rx="3" fill="#334155" />
            <rect x="72" y="132" width="220" height="6" rx="3" fill="#334155" />
            <rect x="88" y="148" width="180" height="6" rx="3" fill="#1d4ed8" opacity="0.6" />
            <rect x="88" y="164" width="160" height="6" rx="3" fill="#334155" />
            <rect x="88" y="180" width="200" height="6" rx="3" fill="#334155" />
            <rect x="72" y="196" width="160" height="6" rx="3" fill="#1d4ed8" opacity="0.6" />
            <rect x="72" y="212" width="240" height="6" rx="3" fill="#334155" />
            {/* AI spark */}
            <circle cx="380" cy="180" r="36" fill="rgba(99,102,241,0.15)" />
            <circle cx="380" cy="180" r="24" fill="rgba(99,102,241,0.25)" />
            <text x="380" y="186" textAnchor="middle" fontSize="18" fill="#818cf8">✦</text>
            {/* Arrows from code to AI bubble */}
            <line x1="320" y1="180" x2="344" y2="180" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
            {/* Doc card output */}
            <rect x="200" y="260" width="200" height="50" rx="10" fill="#1e2a45" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            <rect x="212" y="272" width="80" height="6" rx="3" fill="#6366f1" opacity="0.8" />
            <rect x="212" y="286" width="120" height="5" rx="2.5" fill="#334155" />
            <rect x="212" y="297" width="100" height="5" rx="2.5" fill="#334155" />
            {/* Arrow down from AI spark */}
            <path d="M 380 216 Q 340 230 300 260" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" fill="none" />
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

      {/* ── TIMELINE ── */}
      <section className="ab-timeline-section">
        <div className="ab-section-label">Journey</div>
        <h2 className="ab-section-title">How we got here</h2>

        <div className="ab-timeline">
          {[
            {
              year: "2024",
              title: "The Idea Was Born",
              desc: "Developers were spending hours writing docs that went stale within weeks. We decided to solve this once and for all — with AI that reads your code and writes the docs for you.",
              color: "#6366f1"
            },
            {
              year: "2025",
              title: "DocufyAi Launched",
              desc: "After months of development, DocufyAi launched with GitHub integration, real-time API docs, and AI-powered summaries. Teams started saving hours every sprint cycle.",
              color: "#8b5cf6"
            },
            {
              year: "Future",
              title: "Expanding the Ecosystem",
              desc: "GitLab, Bitbucket, interactive API explorers, custom doc templates, and team collaboration features are on the roadmap — building the ultimate documentation platform.",
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
                <span className="ab-timeline-year" style={{ color: item.color }}>{item.year}</span>
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
