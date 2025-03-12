const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { authenticate } = require("./authRoutes"); // Use existing auth

// ✅ Save message to database (Requires User Authentication)
router.post("/", authenticate, async (req, res) => {
  try {
    const { repoName, type, text, timestamp } = req.body;
    const userId = req.user.id; // Extracted from authenticated user

    const newMessage = new Message({
      userId,
      repoName,
      type,
      text,
      timestamp,
    });

    await newMessage.save();
    res.status(201).json({ success: true, message: "Message saved." });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// ✅ Fetch chat history for a repository (Requires User Authentication)
router.get("/:userId/:repoName", authenticate, async (req, res) => {
  try {
    const { userId, repoName } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const messages = await Message.find({ userId, repoName }).sort("timestamp");
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching messages for userId:", userId);

    const messages = await Message.find({ userId }).sort("timestamp");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching all messages:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.delete("/:userId/:repoName", authenticate, async (req, res) => {
  try {
    const { userId, repoName } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    await Message.deleteMany({ userId, repoName });

    res.status(200).json({ success: true, message: "Messages deleted successfully." });
  } catch (error) {
    console.error("Error deleting messages:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});




module.exports = router;
