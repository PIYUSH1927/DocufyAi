import React from "react";
import "./Landing1.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaGithub, FaCode, FaHistory, FaCogs } from "react-icons/fa";

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="ln">
    
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="ln-hero"
      >
        <h1 className="ln-title">DocufyAi</h1>
        <p className="ln-subtitle">
          This is a SaaS platform that automates code documentation using AI. Developers connect their repositories, and the system generates structured, easy-to-read documentation. It keeps docs updated as the codebase evolves, making it ideal for teams managing large or rapidly changing projects.
        </p>
        <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="ln-btn"
      onClick={() => navigate("/register")} 
    >
      Get Started
    </motion.button>
      </motion.div>
      
      <div className="ln-features">
        {[
          {
            title: "Automated Documentation",
            description: " uses AI to scan your codebase, extract functions, classes, and API endpoints, and generate structured easy-to-read documentation keeping everything up to date without manual effort.",
            icon: <FaCogs size={40} color="#38bdf8" />
          },
          {
            title: "GitHub Integration",
            description: "Easily connect your GitHub repository to DocufyAi, and it will automatically update your documentation whenever your code changes keeping everything in sync effortlessly.",
            icon: <FaGithub size={40} color="#38bdf8" />
          },
          {
            title: "API Reference Docs",
            description: "DocufyAi automatically generates detailed API documentation, including endpoints, request parameters, and responses ensuring clear, well structured references for developers.",
            icon: <FaCode size={40} color="#38bdf8" />
          },
          {
            title: "Versioned Documentation",
            description: "Track changes effortlessly as DocufyAi maintains versioned documentation, allowing you to compare updates, revert to previous versions, and ensure consistency over time.",
            icon: <FaHistory size={40} color="#38bdf8" />
          }
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: index * 0.3 }}
            className="ln-card"
          >
            <div className="ln-icon">{feature.icon}</div>
            <h2 className="ln-card-title">{feature.title}</h2>
            <p className="ln-card-desc">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
