import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Navbar from "./Navbar";
import { FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showConnectButton, setShowConnectButton] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await axios.get("https://sooru-ai.onrender.com/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        setShowConnectButton(!res.data.githubId); 
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleGitHubConnect = () => {
    window.location.href = "https://sooru-ai.onrender.com/api/auth/github";
  };

  return (
    <div className="home-container">
      <Navbar />
      <div className="home-content">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1 }}
        >
          Welcome, {user?.firstName || "User"} 👋
        </motion.h1>

        <p className="home-subtext">
          Get started with AI-powered documentation for your GitHub repositories.
        </p>

        {showConnectButton && (
          <motion.button
            onClick={handleGitHubConnect}
            className="github-connect-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaGithub size={22} /> Connect to GitHub
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default Home;
