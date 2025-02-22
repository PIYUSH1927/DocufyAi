import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; 

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
      </div>
    </div>
  );
};

export default Login;
