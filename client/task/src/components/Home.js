import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import { FaGithub, FaPlus } from "react-icons/fa";

const Home = () => {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleGitHubLogin = () => {
    window.location.href = "https://sooru-ai.onrender.com/api/auth/github";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const decoded = JSON.parse(atob(token.split(".")[1])); 
        const userId = decoded.id;

        const response = await axios.get(
          `https://sooru-ai.onrender.com/api/user/${userId}`, 
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
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent("https://sooru-ai.onrender.com/api/auth/github/callback");
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${redirectUri}`;
  };
  

  const handleCreateDocument = () => {
    if (user?.githubId) {
      setShowPopup(true);
    } else {
      handleGitHubConnect();
    }
  };

  return (
    <div className="home-container" >
      {/* Dashboard Header */}
      <div className="dashboard-header">
  <h2 style={{position:"relative", top:"9px"}}>Dashboard</h2>
  <div className="buttons" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
    {!user?.githubId && (
      <button className="github-btn" onClick={handleGitHubLogin} style={{ width: "auto", height: "auto" }}>
        <FaGithub className="github-icon" /> Connect to GitHub
      </button>
    )}
    {user?.githubId && (
      <button className="create-btn" onClick={handleCreateDocument} style={{ width: "auto", height: "auto" }}>
        <FaPlus className="icon" /> Create New Project
      </button>
    )}
  </div>
</div>


      {/* Welcome Message */}
      <div className="home-content">
        
      </div>

      {/* Popup for Selecting Repo */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Select a Repository</h2>
            <button className="close-btn" onClick={() => setShowPopup(false)}>✖</button>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
