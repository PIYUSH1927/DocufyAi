import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import {
  FaGithub,
  FaPlus,
  FaSearch,
  FaCloudUploadAlt,
  FaTrash,
} from "react-icons/fa";

const Home = () => {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [sortOption, setSortOption] = useState("Sort by activity ⬇");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [repoMessages, setRepoMessages] = useState({});
  const [deleteRepo, setDeleteRepo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReposs, setFilteredRepos] = useState(repoMessages);

  const navigate = useNavigate();

  useEffect(() => {
    setFilteredRepos(repoMessages); 
  }, [repoMessages]);

  useEffect(() => {
    const hasRefreshed = sessionStorage.getItem("hasRefreshed");

    if (!hasRefreshed) {
      sessionStorage.setItem("hasRefreshed", "true");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, []);

  useEffect(() => {
    sessionStorage.removeItem("refreshed");
  }, []);

  const handleGitHubLogin = () => {
    window.location.href = "https://sooru-ai.onrender.com/api/auth/github";
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newToken = urlParams.get("token");

    if (newToken) {
      localStorage.setItem("token", newToken);
      window.history.replaceState({}, document.title, "/home");
    }
  }, []);

  const handleSearch = () => {
    const filtered = Object.keys(repoMessages).filter((repoName) =>
      repoName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    const updatedRepoMessages = {};
    filtered.forEach((repo) => {
      updatedRepoMessages[repo] = repoMessages[repo];
    });
  
    setFilteredRepos(updatedRepoMessages);
  };

  useEffect(() => {
    const handleSearch = () => {
      const filtered = Object.keys(repoMessages).filter((repoName) =>
        repoName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const updatedRepoMessages = {};
      filtered.forEach((repo) => {
        updatedRepoMessages[repo] = repoMessages[repo];
      });

      setFilteredRepos(updatedRepoMessages);
    };

    handleSearch();
  }, [searchTerm, repoMessages]);
  

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
        setAccessToken(response.data.accessToken);
        setGithubUsername(response.data.username);
        setLoading(false);

        fetchMessages();
        if (response.data.githubId) {
          fetchRepositories();
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = JSON.parse(atob(token.split(".")[1]));
        const userId = decoded.id;

        const response = await axios.get(
          `https://sooru-ai.onrender.com/api/messages/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages(response.data);
        const groupedMessages = response.data.reduce((acc, message) => {
          acc[message.repoName] = message;
          return acc;
        }, {});

        setRepoMessages(groupedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    const fetchRepositories = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          "https://sooru-ai.onrender.com/api/github/repos",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRepos(response.data);
      } catch (error) {
        console.error("Error fetching repos:", error);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleImport = async (repo) => {
    try {
      setIsImporting(true);
      if (!accessToken || !user?.username) {
        console.error("GitHub access token or username is missing.");
        alert("GitHub access token or username is missing.");
        setIsImporting(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage");
        alert("Authentication token is missing. Please log in again.");
        setIsImporting(false);
        return;
      }

      const planLimits = {
        "Free Plan (₹0/month)": 1,
        "Pro Plan (₹499/month)": 10,
        "Enterprise Plan (₹1,499/month)": Infinity,
      };

      const userPlan = user?.currentPlan || "Free Plan (₹0/month)";
      const allowedImports = planLimits[userPlan];

      if (user.Imports >= allowedImports) {
        if (userPlan === "Pro Plan (₹499/month)") {
          alert(
            "You have already imported 10 repositories. Subscribe to the Enterprise Plan to import more."
          );
        } else {
          alert("Upgrade your plan to allow importing more repositories.");
        }
        setIsImporting(false);
        return;
      }

      const response = await axios.post(
        "https://sooru-ai.onrender.com/api/github/clone",
        {
          repoName: repo.name,
          githubToken: accessToken,
          username: user.username,
        }
      );

      if (!response.data.success) {
        alert(response.data.message);
        setIsImporting(false);
        return;
      }

      const analysis = response.data.analysis;

      const generateDocResponse = await axios.post(
        "https://sooru-ai.onrender.com/api/generate-doc",
        { analysis },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (generateDocResponse.data.success) {
        const documentation = generateDocResponse.data.documentation;
        
        // Step 4: Send the generated documentation as a message
        const initialMessage = {
          userId: user._id,
          repoName: repo.name,
          type: "bot",
          text: documentation, // Use the generated documentation here
          timestamp: new Date().toISOString(),
        };
  
        await axios.post(
          "https://sooru-ai.onrender.com/api/messages",
          initialMessage,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        // Step 5: Update the user's import count
        await axios.put(
          `https://sooru-ai.onrender.com/api/user/${user._id}`,
          { Imports: user.Imports + 1 },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
  
        navigate(`/import/${repo.name}`);
      } else {
        alert("Failed to generate documentation. Please try again.");
      }
    } catch (error) {
      console.warn("⚠️ Non-critical error:", error.message);
      alert(
        "Error: Only repositories owned or created by you can be imported.",
        error
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteChat = async (repoName) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete chat for ${repoName}?\n` +
        "⚠️ Note: Deleting chat won't reduce the number of imported repos.",
      "color: red;"
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://sooru-ai.onrender.com/api/messages/${user._id}/${repoName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRepoMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        delete updatedMessages[repoName];
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  const handleGitHubConnect = () => {
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      "https://sooru-ai.onrender.com/api/auth/github/callback"
    );

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${redirectUri}`;
  };

  const handleCreateDocument = () => {
    if (user?.githubId) {
      setShowPopup(true);
    } else {
      handleGitHubConnect();
    }
  };

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="home-container">
      {isImporting && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="dashboard-header">
        <h2 style={{ position: "relative", top: "13px" }}>Dashboard</h2>
        <div
          className="buttons"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {!user?.githubId && (
            <button
              className="githubb-btn github-btn"
              onClick={handleGitHubLogin}
              style={{ width: "auto", height: "auto" }}
            >
              <FaGithub className="githubb-icon" /> Connect to GitHub
            </button>
          )}
          {user?.githubId && (
            <button
              className="githubb-btn github-btn"
              onClick={handleCreateDocument}
              style={{ width: "auto", height: "auto", background: "#016601" }}
            >
              <FaPlus className="icon" style={{ color: "white" }} /> Create New
              Project
            </button>
          )}
        </div>
      </div>

      <div className="home-content">
        {/* Search Bar and Controls */}
        <div className="unique-header-controls">
          <div className="unique-search-container">
            <FaSearch style={{ color: "black" }} />
            <input
              type="text"
              className="unique-search-box"
              placeholder="Search Repositories and Projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="unique-add-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        <p
          className="imported-repos-text"
          style={{ textAlign: "center", position: "relative", bottom: "30px" }}
        >
          Total imported repos: {user?.Imports ?? 0}
        </p>

        <hr
          style={{
            position: "relative",
            bottom: "25px",
            background: "grey",
            height: "0.5px",
            border: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            position: "relative",
            bottom: "15px",
          }}
        >
          {Object.keys(filteredReposs).map((repoName) => (
            <div
              key={repoName}
              className="repo-card"
              style={{ margin: "10px 10px", cursor: "pointer" }}
              onClick={() => navigate(`/import/${repoName}`)}
            >
              <div
                className="delete-container"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(repoName);
                }}
              >
                <FaTrash className="delete-icon" />
                <span className="delete-tooltip">Delete chat</span>
              </div>
              <div class="repo-title pb">{repoName}-Documentation</div>
              <span className="delete-tooltip">Delete chat</span>
              <div class="github-info pb">
                <img
                  src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                  alt="GitHub Logo"
                />
                {githubUsername}/{repoName}
              </div>
              <div class="repo-update">
  {repoMessages[repoName]?.timestamp ? formatDate(repoMessages[repoName].timestamp) : "No timestamp available"}
</div>

            </div>
          ))}
        </div>

        {Object.keys(repoMessages).length === 0 && (
          <div className="unique-main-content">
            <FaCloudUploadAlt className="unique-upload-icon" />
            <h3>Create your first project</h3>
            <p>
              Connect your GitHub repository and generate AI-powered
              documentation effortlessly.
            </p>
          </div>
        )}
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2 className="popup-title">Import Git Repository</h2>
            <h2 className="close-btn" onClick={() => setShowPopup(false)}>
              ✖
            </h2>

            {/* GitHub Username & Search Box */}
            <div className="popup-header">
              <div className="github-user">
                <FaGithub className="github-icon" />
                {user?.username || "GitHub User"}
              </div>
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="repo-list-container">
              <ul className="repo-list">
                {filteredRepos.length > 0 ? (
                  filteredRepos.map((repo) => (
                    <li key={repo.id} className="repo-item">
                      <span>{repo.name}</span>
                      <button
                        className="import-btn"
                        onClick={() => handleImport(repo)}
                      >
                        Import
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="no-repos">No repositories found.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
