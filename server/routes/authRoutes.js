
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");  
const User = require("../models/User"); 
const axios = require("axios");
const nodemailer = require("nodemailer");

const router = express.Router();

require("dotenv").config();

require("../config/passport");

const blacklistedTokens = new Set();

let otpStore = {}; 

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

router.post("/sendotp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = generateOtp();
  otpStore[email] = otp; 

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP", error });
  }
});


router.post("/verifyotp", async (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] && otpStore[email] === otp) {
    delete otpStore[email]; 
    res.status(200).json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Invalid or expired OTP" });
  }
});


router.post("/resetpassword", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!otpStore[email] || otpStore[email] !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (otpStore[email] && otpStore[email] === otp) {

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete otpStore[email]; 

    res.status(200).json({ message: "Password reset successful" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, currentPlan, Imports } = req.body;

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
      currentPlan,
      Imports
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

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

router.post("/checkuser", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(200).json({ exists: true });
    }
    res.status(200).json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized - No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
  }
};

// ✅ Route to Fetch User Repositories from GitHub
router.get("/repos", authenticate, async (req, res) => {
  try {
    if (!req.user.accessToken) {
      return res.status(400).json({ error: "GitHub not connected" });
    }

    let allRepos = [];
    let page = 1;
    let per_page = 100;

    while (true) {
      const response = await axios.get(`https://api.github.com/user/repos?page=${page}&per_page=${per_page}`, {
        headers: { Authorization: `Bearer ${req.user.accessToken}` },
      });

      if (response.data.length === 0) break; // Stop if no more repos
      allRepos = [...allRepos, ...response.data];
      page++;
    }

    res.json(allRepos);
  } catch (error) {
    console.error("GitHub API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

router.get("/github", passport.authenticate("github", { scope: ["user:email", "repo"] }));

router.get("/github/callback",
  passport.authenticate("github", { failureRedirect: "https://docufy-ai.vercel.app/login" }),
  (req, res) => {
    if (!req.user) {
      return res.redirect("https://docufy-ai.vercel.app/login?error=UserNotAuthenticated");
    }

    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.redirect(`https://docufy-ai.vercel.app/home?token=${token}`);
  }
);


const checkBlacklist = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ error: "Token is invalid (logged out)" });
  }

  next();
};

module.exports = router;
