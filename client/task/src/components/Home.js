import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import "./Home.css";
import { FaGithub, FaUser, FaCheckCircle } from "react-icons/fa";

const Home = () => {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          "https://sooru-ai.onrender.com/api/user/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);
        setLoading(false);

        if (response.data.githubId) {
          fetchRepositories();
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };

    const fetchRepositories = async () => {
      try {
        const response = await axios.get(
          "https://sooru-ai.onrender.com/api/github/repos",
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setRepos(response.data);
      } catch (error) {
        console.error("Error fetching repos:", error);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleGitHubConnect = () => {
    window.location.href =
      "https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&scope=repo";
  };

  return (
    <div className="home-container">
      <Navbar />
      <div className="home-content">
        {loading ? (
          <h2>Loading...</h2>
        ) : (
          <>
            <h1>Welcome, {user?.firstName || "User"}! 👋</h1>

            <div className="profile-info">
              <div className="info-item">
                <FaUser className="icon" />
                <p>{user?.email}</p>
              </div>
              <div className="info-item">
                <FaCheckCircle className="icon" />
                <p>{user?.currentPlan}</p>
              </div>
            </div>

            {user?.githubId ? (
              <>
                <h2>Your GitHub Repositories</h2>
                <ul className="repo-list">
                  {repos.length > 0 ? (
                    repos.map((repo) => (
                      <li key={repo.id} className="repo-item">
                        {repo.name}
                      </li>
                    ))
                  ) : (
                    <p>No repositories found.</p>
                  )}
                </ul>
              </>
            ) : (
              <button className="github-btn" onClick={handleGitHubConnect}>
                <FaGithub className="github-icon" /> Connect to GitHub
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
