import React from "react";
import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import About from "./pages/About";  
import Pricing from "./pages/Pricing"; 
import ImportPage from "./pages/ImportPage";
import './App.css'

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token") || new URLSearchParams(window.location.search).get("token");

  if (token) {
    localStorage.setItem("token", token); 
    return element;
  }

  return <Navigate to="/login" />;
};

const AuthRoute = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? <Navigate to="/home" /> : element;
};

const App = () => {

  const navigate = useNavigate();
  const hideNavbarRoutes = ["/import"];

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/home");
    }
  }, [navigate]);

  return (
    <div className="mainclass">
       {!hideNavbarRoutes.some((route) => window.location.pathname.startsWith(route)) && <Navbar />}
      <Routes>
        <Route path="/register" element={<AuthRoute element={<Register />} />} />
        <Route path="/login" element={<AuthRoute element={<Login />} />} />
        <Route path="/" element={<AuthRoute element={<Landing />} />} />

        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
        <Route path="/import/:repoName" element={<ProtectedRoute element={<ImportPage />} />} />
       

        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </div>
  );
};

export default App;
