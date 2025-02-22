const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, req.body);
    res.json({ message: "Profile Updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
