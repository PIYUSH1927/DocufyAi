import React, { useState, useEffect, useRef} from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Home , Copy, Download, RefreshCw } from "lucide-react";
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
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);
  
  
  const rawAnalysis = location.state?.analysis || JSON.parse(localStorage.getItem("repoAnalysis")) || "No analysis available.";

  // Convert analysis JSON to a formatted string
  const formatAnalysis = (analysis) => {
    if (typeof analysis === "string") return analysis; // Already a string, return as is
    if (!analysis || typeof analysis !== "object") return "Invalid analysis data.";
  
    const { totalFiles, fileList } = analysis;
    let message = `📂 **Repository Analysis**\n\n`;
    message += `📌 **Total Files:** ${totalFiles}\n\n📜 **File List:**\n`;
    message += fileList.map(file => `- ${file}`).join("\n");
  
    return message;
  };
  
  const formattedAnalysis = formatAnalysis(rawAnalysis);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
  
        const response = await axios.get(`https://sooru-ai.onrender.com/api/messages/${repoName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
  
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
      setMessages([{ type: "bot", text: formattedAnalysis, timestamp: new Date().toISOString()  }]);
    } else {
      setMessages([{ type: "bot", text: "No analysis available. Try syncing again.", timestamp: new Date().toISOString() }]);
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
        const response = await axios.get(`https://sooru-ai.onrender.com/api/user/${userId}`);
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

  
  const fetchInitialDocumentation = async () => {

    const timestamp = new Date().toISOString();
    try {
      const response = await axios.get(
        `https://sooru-ai.onrender.com/api/github/docs?repo=${repoName}`
      );

      
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: response.data.documentation },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", 
          text: "Failed to generate documentation.",
          timestamp },
      ]);
    }
  };

  const handleGenerate = async () => {
    if (!userInput.trim()) return;
  
    const newMessage = {
      type: "user",
      text: userInput,
      timestamp: new Date().toISOString(),
    };
  
    setMessages((prev) => [...prev, newMessage]);
  
    try {
      const response = await axios.post(
        "https://sooru-ai.onrender.com/api/github/generate-docs",
        { repoName, query: userInput }
      );
  
      const botResponse = {
        type: "bot",
        text: response.data.response,
        timestamp: new Date().toISOString(),
      };
  
      setMessages((prev) => [...prev, botResponse]);
  
      // Save messages to the database
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          "https://sooru-ai.onrender.com/api/messages/save",
          { repoName, type: "user", text: userInput },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        await axios.post(
          "https://sooru-ai.onrender.com/api/messages/save",
          { repoName, type: "bot", text: response.data.response },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Error generating response:", error);
    }
  
    setUserInput("");
  };
  

  const handleDownloadPDF = (index) => {
    if (currentPlan === "Free Plan (₹0/month)") {
      alert("Upgrade to Pro plan to download as a PDF.");
      return;
    }

    if (!messages || !messages[index]) {
      console.error("Message at index not found:", index);
      return;
    }
  
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
  };
  
  

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [index]: "Copied!" }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [index]: "Copy text" }));
    }, 2000);
  };
  
  const handleSyncLatest = async () => {

    if (isSyncing) return; 

  setIsSyncing(true); 

    try {
      const token = localStorage.getItem("token");
      if (!token || !user?.username) {
        alert("GitHub access token or username is missing.");
        return;
      }
  
      setMessages((prev) => [...prev, { type: "bot", text: "🔄 Syncing latest changes...", timestamp: new Date().toISOString() }]);
  
      const response = await axios.post("https://sooru-ai.onrender.com/api/github/clone", {
        repoName: repoName,
        githubToken: accessToken,
        username: user.username,
      });
  
      if (!response.data.success) {
        alert("Sync failed: " + response.data.message);
        return;
      }
  
      const updatedAnalysis = response.data.analysis;
      localStorage.setItem("repoAnalysis", JSON.stringify(updatedAnalysis));
  
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "✅ Successfully synced latest changes!", timestamp: new Date().toISOString() },
        { type: "bot", text: formatAnalysis(updatedAnalysis), timestamp: new Date().toISOString() },
      ]);
  
    } catch (error) {
      console.error("Sync error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "❌ Failed to sync latest changes. Please try again later.", timestamp: new Date().toISOString() },
      ]);
    }
    setTimeout(() => {
      setIsSyncing(false);
    }, 30000);
  };
  

  return (
    <div className="import-page-container" >
      
      {/* Fixed Header */}
      <div className="import-repo-header" style={{paddingBottom:"8px", textAlign:"center"}}>
        <Home className="home-icon"  style={{position:"fixed", left:"17px", top:"6px", paddingRight:"5px", zIndex:"100", cursor:"pointer"}}  onClick={() => navigate("/home")} />
        <span style={{padding:"0px 35px"}} className="repo-name"><b>{repoName}</b> - Documentation</span>
        <a href="#" onClick={handleSyncLatest} className="sync-latest"  style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit", fontSize: "0.9rem", position: "fixed", right: "15px", top:"10px", zIndex:"100px", opacity: isSyncing ? "0.2" : "1",cursor: isSyncing ? "not-allowed" : "pointer",pointerEvents: isSyncing ? "none" : "auto"}}>
          <RefreshCw size={16} className="sync-icon" style={{ marginRight: "4px" }}  />
          <span className="sync-text">{isSyncing ? "Sync Latest" : "Sync Latest"}</span>
        </a>
      </div>
  
      {/* Scrollable Chat Container */}
      <div className="import-chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`import-chat-message ${msg.type}`}>
            {msg.type === "bot" && (
              <div className="bot-message-icons" ref={messagesEndRef}>
                <span className="timestamp">{formatDate(msg.timestamp)}</span>
                <div className="tooltip">
                  <Copy
                    size={16}
                    className="icon"
                    onClick={() => handleCopy(msg.text, index)}
                    title={copyStatus?.[index] || "Copy text"}
                  />
                  <span className="tooltip-text">{copyStatus[index] || "Copy text"}</span>
                </div>
                <div className="tooltip">
                  <Download
                    size={16}
                    className="icon"
                    onClick={() => handleDownloadPDF(index)}
                    title={downloadStatus?.[index] || "Download as PDF"}
                  />
                  <span className="tooltip-text">{downloadStatus[index] || "Download as PDF"}</span>
                </div>
              </div>
            )}
            {msg.text}
          </div>
        ))}
      </div>
  
      {/* Fixed Input Section */}
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
