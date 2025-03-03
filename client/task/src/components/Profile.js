import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import {
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaKey,
  FaCrown,
} from "react-icons/fa";

const Profile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPlan: "",
  });

  const token = localStorage.getItem("token");
  let userId = null;

  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      userId = decoded.id;
    } catch (error) {
      console.error("Invalid token:", error);
    }
  }

  useEffect(() => {
    if (!userId) {
      console.error("User ID not found!");
      return;
    }

    axios
      .get(`https://sooru-ai.onrender.com/api/user/${userId}`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("Error fetching profile:", err));
  }, [userId]);

  const handleChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("User ID not found. Please log in again.");
      return;
    }

    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(profile.phone)) {
      alert("❌ Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      await axios.put(
        `https://sooru-ai.onrender.com/api/user/${userId}`,
        profile
      );
      alert("✅ Profile Updated!");
      navigate("/home");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("❌ Failed to update profile");
    }
  };

  return (
    <div className="bod">
      <div className="profile-container">
        <h2
          className="profile-title"
          style={{ paddingBottom: "8px", color: "rgb(0, 164, 235)" }}
        >
          My Profile
        </h2>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>First Name:</label>
            <div className="input-group">
              <FaUser className="icon" />
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Last Name:</label>
            <div className="input-group">
              <FaUser className="icon" />
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email:</label>
            <div className="input-group">
              <FaKey className="icon" />
              <input
                type="email"
                name="email"
                value={profile.email}
                readOnly
                style={{ opacity: "0.7" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone:</label>
            <div className="input-group">
              <FaPhone className="icon" />
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Current Plan:</label>
            <div className="input-group plan-group">
              <FaCrown className="icon" />
              <span className="plan-text">{profile.currentPlan}</span>
              {profile.currentPlan !== "Enterprise Plan (₹1,999/month)" && (
                <button
                  type="button"
                  className="small-upgrade-button"
                  onClick={() => navigate("/pricing")}
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>

          <button style={{marginTop:"12px"}} type="submit" className="update-button">
            💾 Save Changes
          </button>
        </form>
      </div>
      <br />
    </div>
  );
};

export default Profile;
