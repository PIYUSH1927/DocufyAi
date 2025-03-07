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
router.post("/save", authenticateUser, async (req, res) => {
    try {
      console.log("Incoming request to save message:", req.body);
  
      const { repoName, type, text } = req.body;
  
      if (!repoName || !type || !text) {
        console.error("Missing fields:", { repoName, type, text });
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      console.log("User ID from token:", req.user.id);
  
      const newMessage = new Message({
        userId: req.user.id,
        repoName,
        type,
        text,
      });
  
      await newMessage.save();
      console.log("Message saved successfully");
  
      res.status(201).json({ message: "Message saved successfully" });
    } catch (error) {
      console.error("Error saving message:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  

// **Get messages for a specific repo and user**
router.get("/:repoName", authenticateUser, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user.id, repoName: req.params.repoName }).sort("timestamp");
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
