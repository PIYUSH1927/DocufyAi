import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
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
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      newErrors.email = "Invalid email format";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.phone.match(/^\d{10}$/)) newErrors.phone = "Phone number must be 10 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await axios.post("https://sooru-ai.onrender.com/api/auth/register", formData);

        if (response.status === 201) {
          setSuccessMessage("User registered successfully!");
          setFormData({ firstName: "", lastName: "", email: "", password: "", phone: "" });
          
          alert("User registered successfully!");
          navigate("/login");

        }
      } catch (error) {
        setErrors({ apiError: error.response?.data?.message || "Registration failed" });
      }
    }
  };

  return (
    <div className="register-container">
      <div className="form-container">
        <h2>Register</h2>
        {successMessage && <p className="success" style={{color:"lightgreen"}}>{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
          {errors.firstName && <span className="error">{errors.firstName}</span>}

          <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
          {errors.lastName && <span className="error">{errors.lastName}</span>}

          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
          {errors.email && <span className="error">{errors.email}</span>}

          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} />
          {errors.password && <span className="error">{errors.password}</span>}

          <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
          {errors.phone && <span className="error">{errors.phone}</span>}

          {errors.apiError && <span style={{marginLeft:"100px", fontSize:"medium"}} className="error">{errors.apiError}</span>}

          <button type="submit">Register</button>
        </form>

        <p className="login-link">
          Already registered?{" "}
          <span onClick={() => navigate("/login")} className="login-text">
            Login
          </span>
        </p>

      </div>
    </div>
  );
};

export default Register;
