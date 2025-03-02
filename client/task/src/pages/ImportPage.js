import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ImportPage.css";

const ImportPage = () => {
  const { repoName } = useParams(); // Get repository name from URL
  const [messages, setMessages] = useState([
    { type: "system", text: `Generating documentation for ${repoName}...` },
  ]);
  const [input, setInput] = useState("");

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
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { type: "user", text: input }]);

    try {
      const response = await axios.post(
        "https://sooru-ai.onrender.com/api/github/generate-docs",
        { repoName, query: input }
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

    setInput("");
  };

  const handleDownloadPDF = () => {
    window.open(
      `https://sooru-ai.onrender.com/api/github/download-pdf?repo=${repoName}`,
      "_blank"
    );
  };

  return (
    <div className="import-page" style={{position:"relative", top:"50px"}}>
      <div className="header">{repoName} - Documentation</div>
      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          placeholder="Ask AI to refine documentation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleGenerate}>Generate</button>
        <button className="download-btn" onClick={handleDownloadPDF}>
          Download as PDF
        </button>
      </div>
    </div>
  );
};

export default ImportPage;
