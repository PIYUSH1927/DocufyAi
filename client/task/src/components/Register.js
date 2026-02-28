import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGitHubLogin = () => {
    window.location.href = "https://sooru-ai.onrender.com/api/auth/github";
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      newErrors.email = "Invalid email format";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOtp = async () => {
    try {
      setLoading(true);

      const existingUserResponse = await axios.post("https://sooru-ai.onrender.com/api/auth/checkuser", {
        email: formData.email,
      });

      if (existingUserResponse.data.exists) {
        setErrors({ apiError: "User already exists." });
        setLoading(false);
        return;
      }


      const response = await axios.post("https://sooru-ai.onrender.com/api/auth/sendotp", {
        email: formData.email,
      });

      if (response.status === 200) {
        setShowOtpPopup(true);
        setTimer(60);
      }
    } catch (error) {
      setErrors({ apiError: error.response?.data?.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      sendOtp();
    }
  };

  const handleOtpSubmit = async () => {
    try {
      setLoading(true);
      const response = await axios.post("https://sooru-ai.onrender.com/api/auth/verifyotp", {
        email: formData.email,
        otp: otp,
      });

      if (response.status === 200) {
        try {
          const registerResponse = await axios.post("https://sooru-ai.onrender.com/api/auth/register", {
            ...formData,
            currentPlan: "Free Plan (₹0/month)",
            Imports: 0
          });

          if (registerResponse.status === 201) {
            setSuccessMessage("User registered successfully!");
            setShowOtpPopup(false);
            setFormData({ firstName: "", lastName: "", email: "", password: "", phone: "" });
            localStorage.setItem("registrationMessage", "Registration successful! Please log in.");
            window.location.href = "/login"; // Redirect to login page
          }
        } catch (registerError) {
          const errorMessage = registerError.response?.data?.message || "Registration failed.";
          setErrors({ apiError: errorMessage });
          alert(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid OTP. Please try again.";
      setErrors({ apiError: errorMessage });
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container body">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <div className="form-container">
        <div className="form-logo">
          <div className="form-logo-title">DocufyAi</div>
        </div>
        <h2>Create account</h2>
        <p className="form-subtitle">Start automating your documentation today</p>
        {successMessage && <p className="success">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
          {errors.firstName && <span className="error">{errors.firstName}</span>}

          <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
          {errors.lastName && <span className="error">{errors.lastName}</span>}

          <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleChange} />
          {errors.email && <span className="error">{errors.email}</span>}

          <input type="password" name="password" placeholder="Password (min 6 chars)" value={formData.password} onChange={handleChange} />
          {errors.password && <span className="error">{errors.password}</span>}

          <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
          {errors.phone && <span className="error">{errors.phone}</span>}

          {errors.apiError && <span className="error" style={{ textAlign: "center", fontSize: "13px" }}>{errors.apiError}</span>}

          <button type="submit" disabled={loading}>{loading ? "Sending OTP..." : "Create Account"}</button>
        </form>

        <div className="auth-divider"><span>or sign up with</span></div>

        <button className="github-btn" onClick={handleGitHubLogin}>
          <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" className="github-logo" />
          Sign Up with GitHub
        </button>

        <p className="login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className="login-text">Sign in</span>
        </p>
      </div>

      {showOtpPopup && (
        <div className="otp-popup">
          <div className="otp-box">
            {loading && (
              <div className="otp-loading">
                <div className="loading-spinner" />
              </div>
            )}
            <span className="close-popup" onClick={() => setShowOtpPopup(false)} role="button" aria-label="Close">
              <FaTimes />
            </span>
            <h3>OTP Verification</h3>
            <p className="otp-message">OTP sent to {formData.email}</p>
            <p>(Check spam folder if not received)</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={4}
            />
            <button onClick={handleOtpSubmit} disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
