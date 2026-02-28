import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaCrown,
  FaTimes,
  FaTag
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

  const [isModalOpen, setIsModalOpen] = useState(false);

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
    if (!userId) return;
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

  /* Initials for avatar circle */
  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="bod">
      <div className="profile-container">

        {/* ── Header ── */}
        <div className="profile-header">
          <div className="profile-header-left">
            <div className="profile-avatar">{initials}</div>
            <h2 className="profile-title">My Profile</h2>
          </div>
          <button
            className="small-upgrade-button"
            onClick={() => {
              if (profile.currentPlan === "Enterprise Plan (₹1,499/month)") {
                setIsModalOpen(true);
              } else {
                alert("Upgrade to the Enterprise Plan to access support.");
              }
            }}
          >
            <FaCrown /> Support
          </button>
        </div>

        <hr className="profile-divider" />

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="profile-form">

          {/* First & Last name side-by-side */}
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <div className="input-group">
                <FaUser className="icon" />
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <div className="input-group">
                <FaUser className="icon" />
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <div className="input-group">
              <FaEnvelope className="icon" />
              <input
                type="email"
                name="email"
                value={profile.email}
                readOnly
                placeholder="Email address"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone</label>
            <div className="input-group">
              <FaPhone className="icon" />
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                required
              />
            </div>
          </div>

          {/* Current Plan */}
          <div className="form-group">
            <label>Current Plan</label>
            <div className="input-group plan-group">
              <FaTag className="icon" />
              <span className="plan-text">{profile.currentPlan || "Free Plan"}</span>
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

          <button type="submit" className="update-button">
            Save Changes
          </button>
        </form>
      </div>

      {/* ── Support Modal ── */}
      {isModalOpen && (
        <div className="contact-modal">
          <div className="contact-modal-content">
            <FaTimes className="close-modal" onClick={() => setIsModalOpen(false)} />
            <h2>Contact Support</h2>
            <form
              className="contact-form"
              name="contactForm"
              action="https://formspree.io/f/xpwqvkvn"
              method="POST"
            >
              <input type="email" name="email" value={profile.email} readOnly className="hidden-email-input" />
              <textarea
                name="message"
                placeholder="Write your message here…"
                required
                className="contact-textarea"
              />
              <button type="submit" className="contact-submit-btn">Submit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
