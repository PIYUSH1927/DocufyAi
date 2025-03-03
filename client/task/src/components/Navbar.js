import React, { useState , useEffect} from "react";  
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaTags, FaUserPlus, FaSignOutAlt, FaUser } from "react-icons/fa";
import "./Navbar.css";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState({ avatar: "" });

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);  
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("hasRefreshed");
    handleNavigation("/login");
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let userId = null;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      userId = decoded.id;
    } catch (error) {
      console.error("Invalid token:", error);
      return;
    }

    if (userId) {
      axios
        .get(`https://sooru-ai.onrender.com/api/user/${userId}`)
        .then((res) => {
          if (res.data.avatar) {
            setProfile({ avatar: res.data.avatar });
          }
        })
        .catch((err) => console.error("Error fetching profile:", err));
    }
  }, []);

  return (
    <nav className="nb">
      {/* Logo */}
      <img
        src="/imgg.png"
        alt="Logo"
        className="nb-logo"
        onClick={() => handleNavigation(isAuthenticated ? "/home" : "/")}
      />

     
      <div className="nb-links">
        <p onClick={() => handleNavigation(isAuthenticated ? "/home" : "/")} className="nb-link">Home</p>
        <p onClick={() => handleNavigation("/about")} className="nb-link">About</p>
        <p onClick={() => handleNavigation("/pricing")} className="nb-link">Pricing</p>
        {!isAuthenticated && <p onClick={() => handleNavigation("/register")} className="nb-link">Sign Up</p>}
      </div>

      {/* Mobile Hamburger Menu */}
      <div className="nb-menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes size={30} color="white" /> : <FaBars size={30} color="white" />}
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="nb-mobile-menu">
          <p onClick={() => handleNavigation(isAuthenticated ? "/home" : "/")}><FaHome /> Home</p>
          <p onClick={() => handleNavigation("/about")}><FaInfoCircle /> About</p>
          <p onClick={() => handleNavigation("/pricing")}><FaTags /> Pricing</p>
          {!isAuthenticated && <p onClick={() => handleNavigation("/register")}><FaUserPlus /> Sign Up</p>}
          {isAuthenticated && (
            <>
            <p onClick={() => handleNavigation("/profile")}><FaUser /> Profile</p>
              <p onClick={handleLogout} style={{color:"red"}}><FaSignOutAlt /> Logout</p>
              
            </>
          )}
        </div>
      )}

      {isAuthenticated && (
        <div className="nb-user">
          <p onClick={handleLogout} className="nb-logout">Logout</p>
          <div onClick={() => handleNavigation("/profile")} className="nb-profile">
          <img 
              src={profile.avatar || "https://www.w3schools.com/howto/img_avatar.png"} 
              alt="Profile" 
              className="nb-avatar" 
            />
            <p className="nb-profile-text">Profile</p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
