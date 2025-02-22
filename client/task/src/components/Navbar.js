import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token"); 

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login"); 
  };

  return (
    <nav style={styles.navbar}>

      <img
        src="/imgg.png"
        alt="Logo"
        style={styles.logo}
        onClick={() => navigate(isAuthenticated ? "/home" : "/login")}

      />

{isAuthenticated && (
        <div style={styles.navItems}>

          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>

          <div onClick={() => navigate("/profile")} style={styles.profileContainer}>
            <img src="https://www.w3schools.com/howto/img_avatar.png" alt="Profile" style={styles.profilePic} />
            <p style={styles.profileText}>Profile</p>
          </div>
        </div>
      )}
    </nav>
  );
};

const styles = {
  navbar: {
    width: "100%",
    height: "70px",
    background: "#222",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000,
    boxShadow: "0px 4px 10px rgba(235, 228, 228, 0.2)",
  },
  logo: {
    height: "60px",
    cursor: "pointer",
  },
  navItems: {
    display: "flex",
    alignItems: "center",
  },
  logoutButton: {
    background: "#ff4d4d",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    marginRight: "20px",
    fontSize: "16px",
  },
  profileContainer: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  profilePic: {
    height: "40px",
    borderRadius: "50%",
  },
  profileText: {
    marginLeft: "10px",
    color: "white",
    fontSize: "18px",
  },
};

export default Navbar;
