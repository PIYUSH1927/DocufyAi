import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetData, setResetData] = useState({ email: "", newPassword: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetData({ ...resetData, [e.target.name]: e.target.value });



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("https://sooru-ai.onrender.com/api/auth/login", formData, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err) {
      alert("Login failed! Incorrect username or password");
    } finally {
      setLoading(false);
    }
  };

  window.onload = function () {
    const message = localStorage.getItem("registrationMessage");
    if (message) {
      showToast(message); // Function to show the message
      localStorage.removeItem("registrationMessage"); // Remove after displaying
    }
  };

  function showToast(message) {
    const toast = document.createElement("div");
    toast.innerText = message;
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "black";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "1000";

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  const handleGitHubLogin = () => {
    window.location.href = "https://sooru-ai.onrender.com/api/auth/github";
  };

  const sendOtp = async () => {
    if (!resetData.email.trim()) {
      alert("Please enter your email before requesting OTP.");
      return;
    }
    setLoading(true);
    try {

      const userCheckRes = await axios.post("https://sooru-ai.onrender.com/api/auth/checkuser", { email: resetData.email });

      if (userCheckRes.data.exists) {

        await axios.post("https://sooru-ai.onrender.com/api/auth/sendotp", { email: resetData.email });
        setOtpSent(true);
        alert(`OTP sent to ${resetData.email}`);
        setCountdown(60);
      } else {
        alert("User does not exist. Please enter a registered email.");
      }
    } catch (error) {
      alert("Error verifying email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [countdown]);



  const handleResetSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post("https://sooru-ai.onrender.com/api/auth/resetpassword", {
        email: resetData.email,
        otp: resetData.otp,
        newPassword: resetData.newPassword,
      });


      if (res.status === 200) {
        alert("Password reset successful!");
        setShowForgotPassword(false);
        setOtpSent(false);
        setResetData({ email: "", newPassword: "", otp: "" });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP or failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container body">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <div className="form-container">
        <div className="form-logo">
          <div className="form-logo-title">DocufyAi</div>
        </div>
        <h2>Welcome back</h2>
        <p className="form-subtitle">Sign in to continue building great docs</p>
        <form onSubmit={handleSubmit}>
          <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </form>

        <p className="forgot-password" onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>

        <div className="auth-divider"><span>or continue with</span></div>

        <button className="github-btn" onClick={handleGitHubLogin}>
          <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" className="github-logo" />
          Login with GitHub
        </button>

        <p className="register-link">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")} className="register-text">Sign up free</span>
        </p>
      </div>

      {showForgotPassword && (
        <div className="otp-popup">
          <div className="otp-box">
            {loading && (
              <div className="otp-loading">
                <div className="loading-spinner" />
              </div>
            )}
            <span className="close-popup" onClick={() => setShowForgotPassword(false)} role="button" aria-label="Close">
              <FaTimes />
            </span>
            <h3>Reset Password</h3>
            <input type="email" name="email" placeholder="Your email address" value={resetData.email} onChange={handleResetChange} />
            <button onClick={sendOtp} disabled={loading || countdown > 0}>
              {countdown > 0 ? `Resend OTP in ${countdown}s` : "Send OTP"}
            </button>
            {otpSent && (
              <>
                <p className="otp-message">OTP sent to {resetData.email}</p>
                <p>(Check spam folder if not received)</p>
                <input type="text" name="otp" placeholder="Enter OTP" value={resetData.otp} onChange={handleResetChange} maxLength={4} />
                <input type="password" name="newPassword" placeholder="New Password" value={resetData.newPassword} onChange={handleResetChange} />
                <button onClick={handleResetSubmit} disabled={loading}>Reset Password</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
