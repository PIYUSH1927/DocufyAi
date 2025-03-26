import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Copy, Download, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import html2pdf from "html2pdf.js";

import jsPDF from "jspdf";
import "jspdf-autotable";
import "./ImportPage.css";

const ImportPage = () => {
  const navigate = useNavigate();
  const { repoName } = useParams();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [copyStatus, setCopyStatus] = useState({});
  const [downloadStatus, setDownloadStatus] = useState({});
  const [currentPlan, setCurrentPlan] = useState("");
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [lastSyncedCommit, setLastSyncedCommit] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const rawAnalysis = location.state?.analysis || "Loading...";

  const formatAnalysis = (analysis) => {
    if (typeof analysis === "string") return analysis;
    if (!analysis || typeof analysis !== "object")
      return "Invalid analysis data.";

    const { totalFiles, fileList } = analysis;
    let message = `📂 **Repository Analysis**\n\n`;
    message += `📌 **Total Files:** ${totalFiles}\n\n📜 **File List:**\n`;
    message += fileList.map((file) => `- ${file}`).join("\n");

    return message;
  };

  const fetchDefaultBranch = async () => {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${user.username}/${repoName}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data.default_branch;
    } catch (error) {
      console.error("Error fetching default branch:", error);
      return null;
    }
  };

  const fetchLatestCommitHash = async () => {
    try {
      const branch = await fetchDefaultBranch();
      if (!branch) {
        console.error("Could not determine default branch.");
        return null;
      }

      const response = await axios.get(
        `https://api.github.com/repos/${user.username}/${repoName}/commits/${branch}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data.sha;
    } catch (error) {
      console.error("Error fetching latest commit:", error);
      return null;
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = JSON.parse(atob(token.split(".")[1]));
      const userId = decoded.id;

      const response = await axios.get(
        `https://sooru-ai.onrender.com/api/messages/${userId}/${repoName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sortedMessages = response.data.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      setMessages(sortedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [repoName]);

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
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();

    if (rawAnalysis) {
      const formattedAnalysis = formatAnalysis(rawAnalysis);
      setMessages([
        {
          type: "bot",
          text: formattedAnalysis,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      setMessages([
        {
          type: "bot",
          text: "No analysis available. Try syncing again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let userId = null;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      userId = decoded.id;
    } catch (error) {
      console.error("Invalid token:", error);
      return;
    }

    if (userId) {
      try {
        const response = await axios.get(
          `https://sooru-ai.onrender.com/api/user/${userId}`
        );
        setCurrentPlan(response.data.currentPlan);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }
  };

  const formatDate = (timestamp) => {
    const dateObj = new Date(timestamp);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    const formattedDate = dateObj.toLocaleDateString("en-GB", options);

    const formattedTime = dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${formattedDate}, ${formattedTime}`;
  };

  const handleGenerate = async () => {
    if (!userInput.trim()) return;

    const maxLength = 5000;

    if (userInput.length > maxLength) {
      const tooLongMessage = {
        type: "bot",
        text: "⚠️ Your input is too long. Please shorten it and try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tooLongMessage]);
      setUserInput("");
      return;
    }

    setIsGenerating(true);

    const timestamp = new Date().toISOString();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("User not authenticated!");
      setIsGenerating(false);
      return;
    }

    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.id;

    const userMessage = {
      userId,
      repoName,
      type: "user",
      text: userInput,
      timestamp,
    };
    const inputText = userInput;
    setUserInput("");
    setMessages((prev) => [...prev, userMessage]);

    try {
      await axios.post(
        "https://sooru-ai.onrender.com/api/messages",
        userMessage,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const loadingMessage = {
        type: "bot",
        text: "🔄 Generating response...",
        isLoading: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, loadingMessage]);

      const generateDocResponse = await axios.post(
        "https://sooru-ai.onrender.com/api/generate-doc",
        { userInput: inputText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));

      if (generateDocResponse.data.documentation) {
        const botResponse = {
          userId,
          repoName,
          type: "bot",
          text: generateDocResponse.data.documentation,
          timestamp: new Date().toISOString(),
        };
        await axios.post(
          "https://sooru-ai.onrender.com/api/messages",
          botResponse,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages((prev) => [...prev, botResponse]);
      } else {
        const errorMessage = {
          type: "bot",
          text: "⚠️ Failed to generate documentation. Please try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      fetchMessages();
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));

      const errorMessage = {
        type: "bot",
        text: "⚠️ An error occurred. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = (index) => {
    if (currentPlan === "Free Plan (₹0/month)") {
      alert("Upgrade to Pro plan to download as a PDF.");
      return;
    }
    const formattedElement = document.querySelector(
      `.import-chat-message[data-key="${index}"] .formatted-markdown`
    );

    if (formattedElement && html2pdf) {
      const tempContainer = document.createElement("div");
      tempContainer.className = "formatted-markdown";

      tempContainer.innerHTML = formattedElement.innerHTML;

      const styleElement = document.createElement("style");
      styleElement.textContent = `
        .formatted-markdown {
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          color: #000000;
          background-color: #ffffff;
          padding: 20px;
          padding-top:0px;
          font-family: Arial, sans-serif;
        }
        
        .formatted-markdown h1 {
          font-size: 1.8em;
          font-weight: bold;
          margin-top: 0.6em;
          margin-bottom: 0.6em;
        }
        
        .formatted-markdown h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .formatted-markdown h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 0.8em;
          margin-bottom: 0.4em;
        }
        
        .formatted-markdown h4 {
          font-size: 1em;
          font-weight: bold;
          margin-top: 0.6em;
          margin-bottom: 0.3em;
        }
        
        .formatted-markdown p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        .formatted-markdown ul, .formatted-markdown ol {
          padding-left: 2em;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        .formatted-markdown li {
          margin-top: 0.2em;
          margin-bottom: 0.2em;
        }
        
        .formatted-markdown code {
          font-family: monospace;
          background-color: #f6f8fa;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 100%;
        }
        
        .formatted-markdown pre {
          background-color: #f6f8fa;
          border-radius: 3px;
          padding: 16px;
          overflow: auto;
          margin: 0.8em 0;
        }
        
        .formatted-markdown blockquote {
          padding-left: 1em;
          border-left: 4px solid #ddd;
          color: #666;
          line-height: 1.4;
          margin: 0.7em 0;
        }
        
        .formatted-markdown strong {
          font-weight: bold;
        }
        
        .formatted-markdown em {
          font-style: italic;
        }
        
        .formatted-markdown table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          table-layout: fixed;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .formatted-markdown th, .formatted-markdown td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .formatted-markdown th {
          background-color: #f6f8fa;
          font-weight: bold;
        }
      `;
      tempContainer.appendChild(styleElement);

      const options = {
        margin: 10,
        filename: `${repoName}_documentation.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      html2pdf().from(tempContainer).set(options).save();
    } else {
      const { text } = messages[index];

      if (!text || typeof text !== "string") {
        console.error("Invalid text format for PDF:", text);
        return;
      }

      const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        lineHeightFactor: 1.2,
      });

      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = doc.internal.pageSize.getHeight() - margin * 2;
      let yPosition = margin;

      doc.setFont("Arial", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const lines = doc.splitTextToSize(text, pageWidth);

      lines.forEach((line) => {
        if (yPosition + 5 > pageHeight + margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });

      const fileName = `${repoName}_documentation.pdf`;
      doc.save(fileName);
    }
  };

  const handleCopy = (text, index) => {
    const formattedElement = document.querySelector(
      `.import-chat-message[data-key="${index}"] .formatted-markdown`
    );

    if (formattedElement) {
      const tempContainer = document.createElement("div");

      tempContainer.innerHTML = formattedElement.innerHTML;

      const styleElement = document.createElement("style");
      styleElement.textContent = `
        .formatted-markdown {
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          font-family: Arial, sans-serif;
          font-size: 0.9em;
        }
        
        .formatted-markdown h1 {
          font-size: 1.8em;
          font-weight: bold;
          margin-top: 1.2em;
          margin-bottom: 0.6em;
        }
        
        .formatted-markdown h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .formatted-markdown h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 0.8em;
          margin-bottom: 0.4em;
        }
        
        .formatted-markdown h4 {
          font-size: 1em;
          font-weight: bold;
          margin-top: 0.6em;
          margin-bottom: 0.3em;
        }
        
        .formatted-markdown p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        .formatted-markdown ul, .formatted-markdown ol {
          padding-left: 2em;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        .formatted-markdown li {
          margin-top: 0.2em;
          margin-bottom: 0.2em;
        }
        
        .formatted-markdown code {
          font-family: monospace;
          background-color: #f6f8fa;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 100%;
        }
        
        .formatted-markdown pre {
          background-color: #f6f8fa;
          border-radius: 3px;
          padding: 16px;
          overflow: auto;
          margin: 0.8em 0;
        }
        
        .formatted-markdown blockquote {
          padding-left: 1em;
          border-left: 4px solid #ddd;
          color: #666;
          line-height: 1.4;
          margin: 0.7em 0;
        }
        
        .formatted-markdown strong {
          font-weight: bold;
        }
        
        .formatted-markdown em {
          font-style: italic;
        }
        
        .formatted-markdown table {
          border-collapse: collapse;
          width: 90%;
          margin: 1em 0;
          table-layout: fixed;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 600px;
        }
        
        .formatted-markdown th, .formatted-markdown td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
            font-size: 0.9em;
  white-space: normal; 
  word-break: break-word;
        }
        
        .formatted-markdown th {
          background-color: #f6f8fa;
          font-weight: bold;
        }
      `;
      tempContainer.className = "formatted-markdown";
      tempContainer.appendChild(styleElement);

      document.body.appendChild(tempContainer);
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";

      const range = document.createRange();
      range.selectNode(tempContainer);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      document.execCommand("copy");

      selection.removeAllRanges();
      document.body.removeChild(tempContainer);
    } else {
      navigator.clipboard.writeText(text);
    }

    setCopyStatus((prev) => ({ ...prev, [index]: "Copied!" }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [index]: "Copy text" }));
    }, 2000);
  };

  const handleSyncLatest = async () => {
    if (isSyncing) return;

    setIsSyncing(true);

    const syncMessageTimestamp = new Date().toISOString();

    try {
      const token = localStorage.getItem("token");
      if (!token || !user?.username) {
        alert("GitHub access token or username is missing.");
        setIsSyncing(false);
        return;
      }

      const latestCommit = await fetchLatestCommitHash();
      if (!latestCommit) {
        alert("Failed to check repository changes. Please try again.");
        setIsSyncing(false);
        return;
      }

      if (latestCommit === lastSyncedCommit) {
        alert("✅ Already synced. No new changes found.");
        setIsSyncing(false);
        return;
      }

      const syncMessage = {
        userId: user.id,
        repoName,
        type: "bot",
        text: "🔄 Syncing latest changes...",
        timestamp: syncMessageTimestamp,
      };

      setMessages((prevMessages) => [...prevMessages, syncMessage]);

      const response = await axios.post(
        "https://sooru-ai.onrender.com/api/github/clone",
        {
          repoName,
          githubToken: accessToken,
          username: user.username,
        }
      );

      if (!response.data.success) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.timestamp !== syncMessageTimestamp)
        );
        alert("❌ Sync failed: " + response.data.message);
        setIsSyncing(false);
        return;
      }

      setLastSyncedCommit(latestCommit);

      const updatedAnalysis = response.data.analysis;
      const repoContent = JSON.stringify(updatedAnalysis);

      const generateDocResponse = await axios.post(
        "https://sooru-ai.onrender.com/api/generate-doc",
        { repoContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.timestamp !== syncMessageTimestamp)
      );

      if (generateDocResponse.data.documentation) {
        const newMessage = {
          userId: user.id,
          repoName,
          type: "bot",
          text: generateDocResponse.data.documentation,
          timestamp: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);

        await axios.post(
          "https://sooru-ai.onrender.com/api/messages",
          newMessage,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        const errorMessage = {
          userId: user.id,
          repoName,
          type: "bot",
          text: "⚠️ Failed to generate documentation. Please try again later.",
          timestamp: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, errorMessage]);

        await axios.post(
          "https://sooru-ai.onrender.com/api/messages",
          errorMessage,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      console.error("Sync error:", error);

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.timestamp !== syncMessageTimestamp)
      );

      alert("❌ Sync failed. Please try again.");
    }

    setTimeout(() => {
      setIsSyncing(false);
    }, 10000);
  };

  return (
    <div className="import-page-container">
      <div
        className="import-repo-header"
        style={{ paddingBottom: "8px", textAlign: "center" }}
      >
        <Home
          className="home-icon"
          style={{
            position: "fixed",
            left: "17px",
            top: "6px",
            paddingRight: "5px",
            zIndex: "100",
            cursor: "pointer",
          }}
          onClick={() => navigate("/home")}
        />
        <span style={{ padding: "0px 35px" }} className="repo-name">
          <b>{repoName}</b> - Documentation
        </span>
        <a
          href="#"
          onClick={handleSyncLatest}
          className="sync-latest"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            fontSize: "0.9rem",
            position: "fixed",
            right: "15px",
            top: "10px",
            zIndex: "100px",
            opacity: isSyncing ? "0.5" : "1",
            cursor: isSyncing ? "not-allowed" : "pointer",
            pointerEvents: isSyncing ? "none" : "auto",
          }}
        >
          {isSyncing ? (
            <>
              <span className="spinner"></span>
              <span className="sync-text"> Syncing...</span>
            </>
          ) : (
            <>
              <RefreshCw
                size={16}
                className="sync-icon"
                style={{ marginRight: "4px" }}
              />
              <span className="sync-text">Sync Latest</span>
            </>
          )}
        </a>
      </div>

      <div className="import-chat-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`import-chat-message ${msg.type}`}
            data-key={index}
          >
            {msg.type === "bot" && !msg.isLoading && (
              <div className="bot-message-icons">
                <span className="timestamp">{formatDate(msg.timestamp)}</span>
                <div className="tooltip">
                  <Copy
                    size={16}
                    className="icon"
                    onClick={() => handleCopy(msg.text, index)}
                    title={copyStatus?.[index] || "Copy text"}
                  />
                  <span className="tooltip-text">
                    {copyStatus[index] || "Copy text"}
                  </span>
                </div>
                <div className="tooltip">
                  <Download
                    size={16}
                    className="icon"
                    onClick={() => handleDownloadPDF(index)}
                    title={downloadStatus?.[index] || "Download as PDF"}
                  />
                  <span className="tooltip-text">
                    {downloadStatus[index] || "Download as PDF"}
                  </span>
                </div>
              </div>
            )}
            {msg.isLoading ? (
              <div className="loading-message">
                <span className="spinner"></span>
                <span>Generating response...</span>
              </div>
            ) : msg.type === "bot" ? (
              <div className="formatted-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {msg.text
                    .replace(/\\n/g, "\n")
                    .replace(/\n\s*\n\s*\n/g, "\n\n")
                    .trim()}
                </ReactMarkdown>
              </div>
            ) : (
              <span>{msg.text}</span>
            )}
            <div ref={messagesEndRef}></div>
          </div>
        ))}
      </div>

      <div className="import-input-container">
        <textarea
          className="import-text-input"
          placeholder="Ask AI to refine documentation..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button className="import-generate-btn" onClick={handleGenerate}>
          Generate
        </button>
      </div>
    </div>
  );
};

export default ImportPage;
