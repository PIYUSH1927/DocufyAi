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
          The Story Behind <span>Docufy.Ai</span>
        </motion.h1>
        <p>
          Every great product starts with a problem. Ours was simple – developers hate writing documentation.
        </p>
      </section>
      <br />
  

      <section className="about-docufy" style={{ margin: "auto", textAlign: "center", padding: "20px 8px", borderRadius: "8px" , paddingBottom:"30px"}}>
        <motion.h2 whileHover={{ scale: 1.05 }} style={{ textAlign: "center", fontSize: "2rem", fontWeight: "bold" }}>What is Docufy.Ai?</motion.h2>
        <p>
          <strong>Docufy.Ai</strong> is an advanced AI-powered documentation generator designed to streamline the process of creating and maintaining technical documentation. 
          It seamlessly integrates with GitHub repositories, analyzing your codebase to generate structured, & real-time documentation.
        </p>
        <p>
          Keeping documentation up to date can be a challenge, but with <strong>Docufy.Ai</strong>, you no longer have to worry about outdated or inconsistent docs. 
          Our intelligent system ensures that every update to your codebase is reflected in your documentation automatically.  With features like <strong>automated API reference generation, real-time synchronization, version tracking, and GitHub integration</strong>, 
          Docufy.Ai is the perfect solution for development teams managing large or frequently evolving projects. Say goodbye to time-consuming manual documentation updates and experience the ease of AI-powered automation. 
          <strong>Stay focused on coding while Docufy.Ai takes care of your documentation!</strong>
        </p>
    
      </section>
      <br />
      <br />
     
      <section className="about-timeline">
        <motion.div className="timeline-item" whileHover={{ scale: 1.05 }}>
          <div className="content">
          <h1 className="year" style={{margin:"auto", marginBottom:"5px"}}>2024</h1>
            <h2 style={{color:"maroon", textShadow:"2px 2px 5px rgba(0, 0, 0, 0.5)", fontWeight:"bolder"}}>The Idea was Born</h2>
            <p style={{textAlign:"center"}} >
            
      Developers spend hours writing and updating documentation, often leading to outdated and inconsistent information. <strong>Docufy.Ai</strong> was created to automate this process using AI, that continuously updates documentation, ensuring accuracy, consistency, and efficiency without manual effort.
    </p>
          </div>
        </motion.div>

        <motion.div className="timeline-item" whileHover={{ scale: 1.05 }}>
          <div className="content">
            <h1 className="year" style={{margin:"auto", marginBottom:"5px"}}>2025</h1>
            <h2 style={{color:"maroon", textShadow:"2px 2px 5px rgba(0, 0, 0, 0.5)", fontWeight:"bolder"}}>Docufy.Ai Launched</h2>
            <p style={{textAlign:"center"}} >
            After extensive development and testing, <strong>Docufy.Ai</strong> launched with core features including GitHub integration, real time API documentation, and AI powered summaries. By analyzing code changes, it keeps documentation up to date, letting developers focus on coding while AI handles the rest.
            </p>
          </div>
        </motion.div>

        <motion.div className="timeline-item" whileHover={{ scale: 1.05 }}>
          <div className="content">
          <h1 className="year" style={{margin:"auto", marginBottom:"5px"}}>Future</h1>
            <h2 style={{color:"maroon", textShadow:"2px 2px 5px rgba(0, 0, 0, 0.5)", fontWeight:"bolder"}}>Expanding to More Languages</h2>
            <p style={{textAlign:"center"}} >
            <strong>Docufy.Ai</strong> will soon support GitLab, Bitbucket, and other version control platforms, streamlining documentation across workflows. Upcoming features include interactive API explorers and customizable templates, eliminating manual effort efficiently.
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
