const express = require("express");
const Message = require("../models/Message");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// **Save a new message**
router.post("/save", async (req, res) => {
    try {
      const { repoName, type, text } = req.body;
  
      if (!repoName || !type || !text) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      const newMessage = new Message({
        repoName,
        type,
        text,
      });
  
      await newMessage.save();
      res.status(201).json({ message: "Message saved successfully" });
    } catch (error) {
      console.error("Error saving message:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

// **Get messages for a specific repo and user**
router.get("/:repoName", async (req, res) => {
  try {
    const messages = await Message.find({ repoName: req.params.repoName }).sort("timestamp");
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
