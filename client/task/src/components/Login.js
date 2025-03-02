import React, { useState , useEffect} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
      const res = await axios.post("https://sooru-ai.onrender.com/api/auth/login", formData,   {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, 
      } );
      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err) {
      alert( "Login failed! Incorrect username or password");
    } finally {
      setLoading(false);
    }
  };

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
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <button type="submit" disabled={loading}>Login</button>
        </form>

        <p className="register-link">
          New user?{" "}
          <span onClick={() => navigate("/register")} className="register-text">
            Register
          </span>
        </p>

        <p className="forgot-password" onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>
  
        <button className="github-btn" onClick={handleGitHubLogin} style={{background:"black"}}>
        <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" className="github-logo" />
        Login with GitHub
      </button>


      </div>

      {showForgotPassword && (
        <div className="otp-popup">
          <div className="otp-box">
            <h2 className="close-popup"  style={{cursor:"pointer"}}  onClick={() => setShowForgotPassword(false)}>×</h2>
            <h3>Reset Password</h3>
            <input type="email" name="email" placeholder="Email" value={resetData.email} onChange={handleResetChange} />
            <button onClick={sendOtp} disabled={loading || countdown > 0}>
              {countdown > 0 ? `Resend OTP in ${countdown}s` : "Send OTP"}
            </button>
            {otpSent && (
              <>
                <input type="text" name="otp" placeholder="Enter OTP" value={resetData.otp} onChange={handleResetChange} maxLength={4} />
                <input type="password" name="newPassword" placeholder="New Password" value={resetData.newPassword} onChange={handleResetChange} />
                <button onClick={handleResetSubmit} disabled={loading} style={{background:"green"}}>Reset Password</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
