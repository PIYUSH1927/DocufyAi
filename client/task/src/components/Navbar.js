import React, { useState , useEffect} from "react";  
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaTags, FaUserPlus, FaSignOutAlt, FaUser } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);  
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
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

  return (
    <nav className="nb">
      {/* Logo */}
      <img
        src="/imgg.png"
        alt="Logo"
        className="nb-logo"
        onClick={() => handleNavigation(isAuthenticated ? "/home" : "/")}
      />

      {/* Desktop Navigation */}
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

      {/* Profile & Logout (Only when authenticated) */}
      {isAuthenticated && (
        <div className="nb-user">
          <p onClick={handleLogout} className="nb-logout">Logout</p>
          <div onClick={() => handleNavigation("/profile")} className="nb-profile">
            <img src="https://www.w3schools.com/howto/img_avatar.png" alt="Profile" className="nb-avatar" />
            <p className="nb-profile-text">Profile</p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
