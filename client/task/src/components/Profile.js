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
    <div className="bod" style={{paddingBottom:"20px"}} >
      <div className="profile-container" >
      <div className="profile-header">
          <h2 className="profile-title" style={{ color: "rgb(0, 164, 235)" , margin:"auto",position:"relative",left:"40px"}}>
            My Profile
          </h2>
          <button
            className="small-upgrade-button"
            style={{background:"Peru"}}
            onClick={() => {
              if (profile.currentPlan === "Enterprise Plan (₹1,999/month)") {
                setIsModalOpen(true);
              } else {
                alert("Upgrade to the Enterprise Plan to access support.");
              }
            }}
          >
            
           <b><FaCrown className="icon" /><span style={{position:"relative", bottom:"4px"}}>Support</span></b> 
          </button>
        </div>

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
              <FaTag className="icon" />
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
            Save Changes
          </button>
        </form>
      </div>

      {isModalOpen && (
  <div className="contact-modal">
    <div className="contact-modal-content">
      <FaTimes className="close-modal" onClick={() => setIsModalOpen(false)} />
      <h2>Contact Support </h2>
      <form className="contact-form" name="contactForm" action="https://formspree.io/f/xpwqvkvn" method="POST">
        <input type="email" name="email" value={profile.email} readOnly className="hidden-email-input" />
        <textarea name="message" placeholder="Write your message here" required className="contact-textarea"></textarea>

        <button type="submit" className="contact-submit-btn">Submit</button>
      </form>
    </div>
  </div>
)}

     
     </div>
  );
};


export default Profile;
