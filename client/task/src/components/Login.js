import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; 

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetData, setResetData] = useState({ email: "", newPassword: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetData({ ...resetData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://sooru-ai.onrender.com/api/auth/login", formData,   {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, 
      } );
      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed!");
    }
  };

  const sendOtp = async () => {
    if (!resetData.email.trim()) {
      alert("Please enter your email before requesting OTP.");
      return;
    }
    setOtpSent(true);
    alert(`OTP sent to ${resetData.email}`);
  };

  const handleResetSubmit = async () => {
    if (resetData.otp === "1234") { 
      alert("Password reset successful!");
      setShowForgotPassword(false);
      setOtpSent(false);
      setResetData({ email: "", newPassword: "", otp: "" });
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="form-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <button type="submit">Login</button>
        </form>

        <p className="register-link">
          New user?{" "}
          <span onClick={() => navigate("/")} className="register-text">
            Register
          </span>
        </p>

        <p className="forgot-password" onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>

      

  
      </div>

      {showForgotPassword && (
        <div className="otp-popup">
          <div className="otp-box">
            <h2 className="close-btn" style={{cursor:"pointer"}} onClick={() => setShowForgotPassword(false)}>×</h2>
            <h3>Reset Password</h3>
            <input type="email" name="email" placeholder="Email" value={resetData.email} onChange={handleResetChange} />
            <button onClick={sendOtp}>Send OTP</button>
            {otpSent && (
              <>
                <input type="text" name="otp" placeholder="Enter OTP" value={resetData.otp} onChange={handleResetChange} maxLength={4} />
                <input type="password" name="newPassword" placeholder="New Password" value={resetData.newPassword} onChange={handleResetChange} />
                <button onClick={handleResetSubmit}>Reset Password</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
