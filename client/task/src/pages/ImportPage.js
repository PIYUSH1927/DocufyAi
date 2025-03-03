import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Home , Copy, Download} from "lucide-react";
import "./ImportPage.css";

const ImportPage = () => {
  const navigate = useNavigate();
  const { repoName } = useParams(); 
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [copyStatus, setCopyStatus] = useState({});
  const [downloadStatus, setDownloadStatus] = useState({});
  

  useEffect(() => {
    fetchInitialDocumentation();
  }, []);

  const fetchInitialDocumentation = async () => {
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
        { type: "bot", text: "Failed to generate documentation." },
      ]);
    }
  };

  const handleGenerate = async () => {
    if (!userInput.trim()) return;

    setMessages((prev) => [...prev, { type: "user", text: userInput }]);

    try {
      const response = await axios.post(
        "https://sooru-ai.onrender.com/api/github/generate-docs",
        { repoName, query: userInput }
      );

      setMessages((prev) => [
        ...prev,
        { type: "bot", text: response.data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error generating response." },
      ]);
    }

    setUserInput(""); 
  };

  const handleDownloadPDF = (index) => {
    setDownloadStatus((prev) => ({ ...prev, [index]: "Downloading..." }));
    setTimeout(() => {
      setDownloadStatus((prev) => ({ ...prev, [index]: "Download as PDF" }));
    }, 2000);
    window.open(
      `https://sooru-ai.onrender.com/api/github/download-pdf?repo=${repoName}`,
      "_blank"
    );
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
          </div>
          {messages.map((msg, index) => (
          <div key={index} className={`import-chat-message ${msg.type}`}>
            {msg.type === "bot" && (
              <div className="bot-message-icons">
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

      {/* Input Box + Buttons (Like ChatGPT) */}
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
