const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");  
const User = require("../models/User"); 
const router = express.Router();


const blacklistedTokens = new Set();

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found. Please check your email and try again." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect password. Please try again." });

    const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1h" });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) return res.status(400).json({ error: "No token provided" });

    blacklistedTokens.add(token);

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const checkBlacklist = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ error: "Token is invalid (logged out)" });
  }

  next();
};

module.exports = router;
