import React from "react";
import "./About.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const About = () => {

  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  const handleGetStarted = () => {
    navigate(isAuthenticated ? "/home" : "/register");
  };

  return (
    <div className="about-page " style={{marginTop:"30px"}} >
 
      <section className="about-hero" style={{position:"relative", top:"25px"}}>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          The Story Behind <span>Docufy.ai</span>
        </motion.h1>
        <p>
          Every great product starts with a problem. Ours was simple – developers hate writing documentation.
        </p>
      </section>
      <br />
      <br />
  
      <section className="about-docufy" style={{textAlign:"justify"}}>
        <motion.h2 whileHover={{ scale: 1.05 }} style={{textAlign:"center"}}>What is Docufy.ai?</motion.h2>
        <p>
          <strong>Docufy.ai</strong> is an AI-powered documentation generator that automates the process of creating technical docs.
          It integrates with GitHub repositories to analyze your codebase and generates structured, interactive, and real-time documentation.
        </p>
        <p>
          No more outdated docs or time-consuming documentation updates — Docufy.ai keeps your docs up-to-date automatically.
        </p>
      </section>
      <br />

     
      <section className="about-timeline">
        <motion.div className="timeline-item" whileHover={{ scale: 1.05 }}>
          <div className="year">2024</div>
          <div className="content">
            <h2 style={{color:"maroon"}}>The Idea was Born</h2>
            <p>
              We realized that developers waste too much time writing and maintaining documentation.
              The vision of AI-powered, auto-updating documentation was created.
            </p>
          </div>
        </motion.div>

        <motion.div className="timeline-item" whileHover={{ scale: 1.05 }}>
          <div className="year">2025</div>
          <div className="content">
            <h2 style={{color:"maroon"}}>Docufy.ai Launched</h2>
            <p>
              After months of hard work, Docufy.ai launched with GitHub integration, API documentation, and
              real-time AI-powered summaries.
            </p>
          </div>
        </motion.div>

        <motion.div className="timeline-item" whileHover={{ scale: 1.05 }}>
          <div className="year">Future</div>
          <div className="content">
            <h2 style={{color:"maroon"}}>Expanding to More Languages</h2>
            <p>
              Our goal is to support Python, Java, Go, Rust, and more, making Docufy.ai the universal standard for AI-powered code documentation.
            </p>
          </div>
        </motion.div>
      </section>
     <br />
     <br />
  

      <section className="about-cta">
        <h2 style={{color:"grey"}}>Join the Future of Documentation</h2>
        <p>We are building something revolutionary. Be part of it.</p>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="about-btn" onClick={handleGetStarted}>
          Get Started
        </motion.button>
      </section>
    </div>
  );
};

export default About;
