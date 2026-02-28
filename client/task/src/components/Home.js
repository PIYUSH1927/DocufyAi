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
  const [messagesLoading, setMessagesLoading] = useState(true);
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
        // Don't clear loading here — wait for fetchMessages to finish

        await fetchMessages();
        if (response.data.githubId) {
          fetchRepositories();
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
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
      } finally {
        setMessagesLoading(false);
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
        const errorMessage = response.data.errorDetails
          ? "Repository import failed. Possible reasons:\n\n" +
          response.data.errorDetails.map(detail => `• ${detail}`).join('\n')
          : response.data.message;

        alert(errorMessage);
        setIsImporting(false);
        return;
      }

      const analysis = response.data.analysis;

      const repoContent = JSON.stringify(analysis);

      const generateDocResponse = await axios.post(
        "https://sooru-ai.onrender.com/api/generate-doc",
        {
          repoContent,
          userId: user._id,
          repoName: repo.name
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // The backend doesn't return a success field, it directly returns the documentation
      if (generateDocResponse.data.documentation) {
        const documentation = generateDocResponse.data.documentation;

        const initialMessage = {
          userId: user._id,
          repoName: repo.name,
          type: "bot",
          text: documentation,
          timestamp: new Date().toISOString(),
        };

        await axios.post(
          "https://sooru-ai.onrender.com/api/messages",
          initialMessage,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await axios.put(
          `https://sooru-ai.onrender.com/api/user/${user._id}`,
          { Imports: user.Imports + 1 },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        navigate(`/import/${repo.name}`);
      } else {
        console.error("Documentation generation failed:", generateDocResponse.data);
        alert("Failed to generate documentation. Please try again.");
      }
    } catch (error) {
      console.error("Import error:", error);
      console.warn("⚠️ Non-critical error:", error.message);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      alert(
        "Repository import failed. Possible reasons:\n\n" +
        "• Only repositories owned or created by you can be imported\n" +
        "• Repository doesn't contain code files (documentation works only for code repositories)\n" +
        "• Repository contains extremely large files or ML models that exceed size limits"
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

      {/* Full-page loader: shown until profile + messages both loaded */}
      {(loading || messagesLoading) && (
        <div className="home-loading">
          <div className="spin-ring" />
          <p>Loading your dashboard…</p>
        </div>
      )}

      {isImporting && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(8, 12, 20, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(17, 24, 39, 0.98)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '20px',
            padding: '40px 36px',
            maxWidth: '420px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 80px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              border: '3px solid rgba(99,102,241,0.15)',
              borderTop: '3px solid #6366f1',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              animation: 'spin 0.8s linear infinite'
            }}></div>
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#818cf8', fontFamily: '"Space Grotesk", sans-serif', fontWeight: '700' }}>Generating Documentation</h3>
              <p style={{ margin: '6px 0', fontSize: '14px', lineHeight: '1.7', color: '#4b5563', fontFamily: 'Inter, sans-serif' }}>Analyzing your repository and generating structured documentation...</p>
              <p style={{ margin: '6px 0', fontSize: '14px', lineHeight: '1.7', color: '#4b5563', fontFamily: 'Inter, sans-serif' }}>This may take 5–10 minutes for large repositories.</p>
              <p style={{ fontStyle: 'italic', fontSize: '12px', color: '#374151', marginTop: '12px', fontFamily: 'Inter, sans-serif' }}>Tip: Complex repos with many files may take longer.</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <h2>Dashboard</h2>
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
              className="githubb-btn create-btn"
              onClick={handleCreateDocument}
            >
              <FaPlus className="icon" /> Create New Project
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

        <p className="imported-repos-text">
          Total imported repos: {user?.Imports ?? 0}
        </p>

        <div className="repo-cards-grid">
          {Object.keys(filteredReposs).map((repoName) => (
            <div
              key={repoName}
              className="repo-card"
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
              </div>
              <div className="repo-title">{repoName} Documentation</div>
              <div className="github-info">
                <img
                  src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                  alt="GitHub"
                />
                {githubUsername}/{repoName}
              </div>
              <div className="repo-update">
                {repoMessages[repoName]?.timestamp
                  ? formatDate(repoMessages[repoName].timestamp)
                  : "No timestamp"}
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
            <button className="close-btn" onClick={() => setShowPopup(false)}>✕</button>

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