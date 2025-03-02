const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");

// 🔹 Fetch Repositories
router.get("/repos", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: "GitHub not connected" });
    }

    const githubResponse = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `token ${user.accessToken}` },
    });

    res.json(githubResponse.data);
  } catch (error) {
    console.error("Error fetching GitHub repos:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

module.exports = router;
