import React, { useState, useEffect } from "react";
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
  


  const location = useLocation();
const analysis = location.state?.analysis || JSON.parse(localStorage.getItem("repoAnalysis")) || "No analysis available.";



  useEffect(() => {
    fetchUserProfile();
    //fetchInitialDocumentation();
    if (analysis) {
      setMessages([{ type: "bot", text: analysis }]);
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

    const timestamp = new Date().toISOString();

    setMessages((prev) => [...prev, { type: "user", text: userInput , timestamp}]);

    try {
      const response = await axios.post(
        "https://sooru-ai.onrender.com/api/github/generate-docs",
        { repoName, query: userInput }
      );

      setMessages((prev) => [
        ...prev,
        { type: "bot", text: response.data.response, timestamp: new Date().toISOString() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error generating response.",  timestamp },
      ]);
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
  

  return (
    <div className="import-page-container" >
      <div className="import-chat-container">
      
        <div className="import-repo-name" style={{paddingBottom:"8px"}}> 
        <Home style={{position:"fixed", left:"17px", paddingRight:"5px", zIndex:"100", cursor:"pointer"}} onClick={() => navigate("/home")} />
          <span style={{padding:"0px 35px"}}>{repoName} - Documentation</span>
          <a href="" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit", fontSize: "0.9rem", position: "fixed", right: "17px", top:"20px", zIndex:"100px" }}>
          <RefreshCw size={16} style={{ marginRight: "5px" }} /> <span className="sync-text">Sync Latest</span>
        </a>
          </div>
          {messages.map((msg, index) => (
          <div key={index} className={`import-chat-message ${msg.type}`}>
            {msg.type === "bot" && (
              <div className="bot-message-icons">
                 <span className="timestamp" >{formatDate(msg.timestamp)}</span>
                  <div className="tooltip">
                <Copy
                  size={16}
                  className="icon"
                  onClick={() => handleCopy(msg.text, index)}
                  title={copyStatus?.[index] || "Copy text"}                
                  style={{zIndex:"100"}}
                />
                <span className="tooltip-text">{copyStatus[index] || "Copy text"}</span>
                 </div>

                 <div className="tooltip">
                <Download
                  size={16}
                  className="icon"
                  onClick={() => handleDownloadPDF(index)}
                  title={downloadStatus?.[index] || "Download as PDF"}
                  style={{zIndex:"100"}}
                />
                 <span className="tooltip-text">{downloadStatus[index] || "Download as PDF"}</span>
                </div>
              </div>
            )}
            {msg.text}
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
