import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ImportPage.css";

const ImportPage = () => {
  const { repoName } = useParams(); // Get repository name from URL
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");

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

    setUserInput(""); // Clear input field after submission
  };

  const handleDownloadPDF = () => {
    window.open(
      `https://sooru-ai.onrender.com/api/github/download-pdf?repo=${repoName}`,
      "_blank"
    );
  };

  return (
    <div className="import-page-container" style={{position:"relative", top:"60px"}}>
      <div className="import-chat-container">
        {/* Repo Name as Heading Inside Chat */}
        <div className="import-repo-name">{repoName} - Documentation</div>

        {messages.map((msg, index) => (
          <div key={index} className={`import-chat-message ${msg.type}`}>
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
        <button className="import-download-btn" onClick={handleDownloadPDF}>
          ⬇ PDF
        </button>
      </div>
    </div>
  );
};

export default ImportPage;
