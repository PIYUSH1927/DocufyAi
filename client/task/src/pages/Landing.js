import React from "react";
import "./Landing1.css";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaGithub, FaCode, FaHistory, FaCogs, FaBolt } from "react-icons/fa";

const Landing = () => {
  const navigate = useNavigate();

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="ln dot-grid">
      <Helmet>
        <title>DocufyAi - AI-Powered Code Documentation</title>
        <meta name="description" content="DocufyAi is an AI-driven SaaS platform that automates technical documentation for developers. Connect your GitHub repositories and generate structured, real-time docs effortlessly." />
        <meta property="og:title" content="DocufyAi - AI-Powered Code Documentation" />
        <meta property="og:description" content="AI-powered documentation generator that integrates with GitHub, creating structured, always-updated docs for your codebase." />
        <meta property="og:url" content="https://docufyai.in" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="DocufyAi" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* HERO — bg canvas is INSIDE hero so it clips on scroll */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="ln-hero"
      >
        {/* ── PRODUCT STORY SVG (inside hero, position:absolute) ── */}
        <div className="ln-bg-canvas" aria-hidden="true">
          <svg className="ln-bg-svg" viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.13" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="orb3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.09" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.55" />
              </linearGradient>
              <filter id="glow2">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Ambient background orbs — safe corners only */}
            <ellipse cx="80" cy="160" rx="260" ry="260" fill="url(#orb1)" className="ln-orb ln-orb-a" />
            <ellipse cx="1360" cy="180" rx="240" ry="240" fill="url(#orb2)" className="ln-orb ln-orb-b" />

            {/* ══ LEFT: GitHub Repo card ══
                Positioned at far left edge, vertically centered in hero */}
            <g className="ln-node ln-node-github" opacity="0.82">
              <rect x="-8" y="270" width="200" height="170" rx="14" fill="#0d1526" stroke="rgba(99,102,241,0.35)" strokeWidth="1.5" />
              <rect x="-8" y="270" width="200" height="3" rx="1.5" fill="#6366f1" opacity="0.9" />
              {/* GitHub icon circle */}
              <circle cx="94" cy="327" r="24" fill="rgba(99,102,241,0.1)" stroke="#818cf8" strokeWidth="1.5" />
              <text x="94" y="333" textAnchor="middle" fontSize="18" fill="#818cf8">⌥</text>
              <text x="94" y="360" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6366f1" fontFamily="Inter,sans-serif" letterSpacing="1">GITHUB REPO</text>
              {/* Simulated code lines */}
              <rect x="12" y="372" width="52" height="5" rx="2.5" fill="#1d4ed8" opacity="0.7" className="ln-cl ln-cl1" />
              <rect x="12" y="384" width="80" height="5" rx="2.5" fill="#263348" />
              <rect x="12" y="396" width="68" height="5" rx="2.5" fill="#263348" />
              <rect x="12" y="408" width="88" height="5" rx="2.5" fill="#1d4ed8" opacity="0.4" className="ln-cl ln-cl2" />
              <rect x="12" y="420" width="60" height="5" rx="2.5" fill="#263348" />
            </g>

            {/* ══ Arrow: Repo → (off-left, fades into center) ══ */}
            <line x1="194" y1="355" x2="380" y2="355"
              stroke="url(#arrowGrad)" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.35" />
            <circle r="4" fill="#6366f1" opacity="0.75" filter="url(#glow2)">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M194,355 L380,355" />
            </circle>
            <circle r="2.8" fill="#a5b4fc" opacity="0.55">
              <animateMotion dur="2.5s" begin="1.1s" repeatCount="indefinite" path="M194,355 L380,355" />
            </circle>



            {/* ══ Arrow: (off-right) → Docs ══ */}
            <line x1="1060" y1="355" x2="1246" y2="355"
              stroke="url(#arrowGrad)" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.35" />
            <circle r="4" fill="#22d3ee" opacity="0.75" filter="url(#glow2)">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M1060,355 L1246,355" />
            </circle>
            <circle r="2.8" fill="#6366f1" opacity="0.5">
              <animateMotion dur="2.5s" begin="1.1s" repeatCount="indefinite" path="M1060,355 L1246,355" />
            </circle>

            {/* ══ RIGHT: Documentation card ══
                Positioned at far right edge */}
            <g className="ln-node ln-node-doc" opacity="0.82">
              <rect x="1248" y="260" width="200" height="190" rx="14" fill="#0d1526" stroke="rgba(34,211,238,0.3)" strokeWidth="1.5" />
              <rect x="1248" y="260" width="200" height="3" rx="1.5" fill="#22d3ee" opacity="0.8" />
              {/* Header tag */}
              <rect x="1264" y="278" width="72" height="8" rx="4" fill="#6366f1" opacity="0.85" className="ln-dl ln-dl1" />
              {/* Body */}
              <rect x="1264" y="296" width="162" height="5" rx="2.5" fill="#263348" />
              <rect x="1264" y="308" width="140" height="5" rx="2.5" fill="#263348" />
              <rect x="1264" y="320" width="155" height="5" rx="2.5" fill="#263348" />
              <rect x="1264" y="336" width="80" height="8" rx="4" fill="#8b5cf6" opacity="0.7" className="ln-dl ln-dl2" />
              <rect x="1264" y="354" width="162" height="5" rx="2.5" fill="#263348" />
              <rect x="1264" y="366" width="128" height="5" rx="2.5" fill="#263348" />
              <rect x="1264" y="378" width="145" height="5" rx="2.5" fill="#263348" />
              <rect x="1264" y="394" width="72" height="8" rx="4" fill="#22d3ee" opacity="0.55" className="ln-dl" />
              <rect x="1264" y="412" width="162" height="5" rx="2.5" fill="#263348" />
              <rect x="1264" y="424" width="110" height="5" rx="2.5" fill="#263348" />
              <text x="1348" y="464" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#22d3ee" fontFamily="Inter,sans-serif" letterSpacing="1">DOCUMENTATION</text>
            </g>

            {/* ══ Floating code snippet — bottom left corner ══ */}
            <g className="ln-snippet ln-snippet-bl" opacity="0.62">
              <rect x="10" y="490" width="230" height="115" rx="10" fill="#0a1120" stroke="rgba(99,102,241,0.18)" strokeWidth="1" />
              <rect x="10" y="490" width="230" height="2" rx="1" fill="rgba(99,102,241,0.45)" />
              <text x="26" y="511" fill="#374151" fontSize="9" fontFamily="monospace">// auto-generated by DocufyAi</text>
              <text x="26" y="526" fill="#6366f1" fontSize="9" fontFamily="monospace">/**</text>
              <text x="26" y="540" fill="#475569" fontSize="9" fontFamily="monospace"> * @function getUserById</text>
              <text x="26" y="554" fill="#475569" fontSize="9" fontFamily="monospace"> * @param  id: string</text>
              <text x="26" y="568" fill="#475569" fontSize="9" fontFamily="monospace"> * @returns Promise&lt;User&gt;</text>
              <text x="26" y="582" fill="#6366f1" fontSize="9" fontFamily="monospace"> */</text>
              <text x="26" y="597" fill="#818cf8" fontSize="9" fontFamily="monospace">async getUserById(id) {'{ ... }'}</text>
            </g>

            {/* ══ Floating version badge — bottom right corner ══ */}
            <g className="ln-snippet ln-snippet-br" opacity="0.62">
              <rect x="1195" y="490" width="228" height="88" rx="10" fill="#0a1120" stroke="rgba(34,211,238,0.18)" strokeWidth="1" />
              <rect x="1195" y="490" width="228" height="2" rx="1" fill="rgba(34,211,238,0.4)" />
              <circle cx="1215" cy="513" r="5" fill="rgba(34,211,238,0.28)" />
              <text x="1228" y="517" fill="#22d3ee" fontSize="9" fontFamily="monospace">v2.1.4 — synced ✓</text>
              <text x="1209" y="534" fill="#374151" fontSize="9" fontFamily="monospace">42 functions documented</text>
              <text x="1209" y="549" fill="#374151" fontSize="9" fontFamily="monospace">18 API endpoints mapped</text>
              <text x="1209" y="564" fill="#374151" fontSize="9" fontFamily="monospace">Last sync: 2 min ago</text>
            </g>

            {/* Corner accents */}
            <path d="M22 38 L22 16 L44 16" stroke="#6366f1" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
            <path d="M1418 38 L1418 16 L1396 16" stroke="#6366f1" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        <motion.div
          className="ln-hero-badge"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span></span>
          AI-Powered Documentation
        </motion.div>

        <h1 className="ln-title">DocufyAi</h1>

        <p className="ln-subtitle">
          Stop writing documentation manually. Connect your GitHub repos and let AI generate structured, always-updated technical docs in minutes.
        </p>

        <div className="ln-hero-actions">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="ln-btn"
            onClick={() => navigate("/register")}
          >
            Get Started — It's Free
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="ln-btn-outline"
            onClick={() => navigate("/about")}
          >
            Learn More
          </motion.button>
        </div>
      </motion.div>

      {/* STATS */}
      <motion.div
        className="ln-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {[
          { value: "10x", label: "Faster Docs" },
          { value: "100%", label: "GitHub Synced" },
          { value: "3", label: "Flexible Plans" },
          { value: "AI", label: "Powered Engine" },
        ].map((stat, i) => (
          <div key={i} className="ln-stat">
            <div className="ln-stat-value">{stat.value}</div>
            <div className="ln-stat-label">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* FEATURES */}
      <div className="ln-section-header" style={{ marginTop: "80px" }}>
        <div className="ln-section-label">Features</div>
        <h2 className="ln-section-title">Everything you need to ship great docs</h2>
        <p className="ln-section-desc">Powerful features built for modern development teams who move fast.</p>
      </div>

      <div className="ln-features">
        {[
          {
            title: "Automated Documentation",
            description: "AI scans your codebase, extracts functions, classes, and API endpoints, and generates structured, easy-to-read documentation — zero manual effort.",
            icon: <FaCogs size={26} color="#6366f1" />,
          },
          {
            title: "GitHub Integration",
            description: "Connect any GitHub repository in seconds. DocufyAi automatically syncs whenever your code changes, keeping everything fresh.",
            icon: <FaGithub size={26} color="#6366f1" />,
          },
          {
            title: "API Reference Docs",
            description: "Auto-generate detailed API documentation including endpoints, parameters, and responses — clear and well-structured for every developer.",
            icon: <FaCode size={26} color="#6366f1" />,
          },
          {
            title: "Versioned Documentation",
            description: "Track changes effortlessly. Compare updates, revert to previous versions, and ensure consistency as your codebase evolves.",
            icon: <FaHistory size={26} color="#6366f1" />,
          },
          {
            title: "Instant Generation",
            description: "No waiting days for docs. Generate complete documentation for your entire repository in minutes using our optimized AI pipeline.",
            icon: <FaBolt size={26} color="#6366f1" />,
          },
          {
            title: "Interactive Chat",
            description: "Ask questions about your codebase in natural language. Get contextual answers powered by your own repository's documentation.",
            icon: <FaCode size={26} color="#6366f1" />,
          },
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="ln-card"
          >
            <div className="ln-icon">{feature.icon}</div>
            <h2 className="ln-card-title">{feature.title}</h2>
            <p className="ln-card-desc">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div className="ln-steps">
        <div className="ln-section-header" style={{ marginBottom: "48px" }}>
          <div className="ln-section-label">How It Works</div>
          <h2 className="ln-section-title">From code to docs in 3 steps</h2>
        </div>
        <div className="ln-steps-grid">
          {[
            { num: "01", title: "Connect GitHub", desc: "Link your GitHub account and select any repository." },
            { num: "02", title: "AI Analysis", desc: "Our AI engine analyzes your entire codebase structure." },
            { num: "03", title: "Get Docs", desc: "Receive beautiful, structured documentation instantly." },
          ].map((step, i) => (
            <motion.div
              key={i}
              className="ln-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="ln-step-num">{step.num}</div>
              <div className="ln-step-title">{step.title}</div>
              <div className="ln-step-desc">{step.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        className="ln-cta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2>Ready to automate your docs?</h2>
        <p>Join developers who've ditched manual documentation forever.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="ln-btn"
          onClick={() => navigate("/register")}
        >
          Start for Free
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Landing;
