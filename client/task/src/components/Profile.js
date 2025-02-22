import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Profile.css";
import { FaUser, FaPhone, FaMapMarkerAlt, FaCity, FaGlobe, FaKey } from "react-icons/fa";

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    gst: "",
    profilePic: "",
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

    axios.get(`https://sooru-ai.onrender.com/api/user/${userId}`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("Error fetching profile:", err));
  }, [userId]);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("User ID not found. Please log in again.");
      return;
    }
    try {
      await axios.put(`https://sooru-ai.onrender.com/api/user/${userId}`, profile);
      alert("✅ Profile Updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("❌ Failed to update profile");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfile({ ...profile, profilePic: URL.createObjectURL(file) });
  };

  return (
    <div>
    <div className="profile-container">
      <h2 style={{marginBottom:"5px"}}>My Profile</h2>
      <div className="profile-picture">
        <img src={profile.profilePic || "https://www.w3schools.com/howto/img_avatar.png"} alt="Profile" />
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="row">
          <div className="input-group"><FaUser className="icon" /><input type="text" name="firstName" value={profile.firstName} onChange={handleChange} placeholder="First Name" required /></div>
          <div className="input-group"><FaUser className="icon" /><input type="text" name="lastName" value={profile.lastName} onChange={handleChange} placeholder="Last Name" required /></div>
          <div className="input-group"><FaKey className="icon" /><input type="email" name="email" value={profile.email} readOnly /></div>
        </div>
        <div className="row">
          <div className="input-group"><FaPhone className="icon" /><input type="text" name="phone" value={profile.phone} onChange={handleChange} placeholder="Phone" required /></div>
          <div className="input-group"><FaMapMarkerAlt className="icon" /><input type="text" name="address1" value={profile.address1} onChange={handleChange} placeholder="Address Line 1" required /></div>
          <div className="input-group"><FaMapMarkerAlt className="icon" /><input type="text" name="address2" value={profile.address2} onChange={handleChange} placeholder="Address Line 2" /></div>
          
        </div>
        <div className="row">
       <div className="input-group"><FaMapMarkerAlt className="icon" /><input type="text" name="address3" value={profile.address3} onChange={handleChange} placeholder="Address Line 3" /></div>
          <div className="input-group"><FaCity className="icon" /><input type="text" name="city" value={profile.city} onChange={handleChange} placeholder="City" required /></div>
          <div className="input-group"><FaGlobe className="icon" /><input type="text" name="state" value={profile.state} onChange={handleChange} placeholder="State" required /></div>
          
        </div>
        <div className="row">
        <div className="input-group"><FaGlobe className="icon" /><input type="text" name="country" value={profile.country} onChange={handleChange} placeholder="Country" required /></div>
          <div className="input-group"><FaKey className="icon" /><input type="text" name="pinCode" value={profile.pinCode} onChange={handleChange} placeholder="PIN Code" required /></div>
          <div className="input-group"><FaKey className="icon" /><input type="text" name="gst" value={profile.gst} onChange={handleChange} placeholder="GST (Optional)" /></div>
        </div>
        <br />
        <button type="submit" className="update-button">💾 Save Changes</button>
      </form>
    </div>
    <br />
    </div>
  );
};

export default Profile;