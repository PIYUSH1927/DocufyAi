import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import About from "./pages/About";  
import Pricing from "./pages/Pricing"; 

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? element : <Navigate to="/login" />;
};

const AuthRoute = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? <Navigate to="/home" /> : element;
};

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/register" element={<AuthRoute element={<Register />} />} />
        <Route path="/login" element={<AuthRoute element={<Login />} />} />
        <Route path="/" element={<AuthRoute element={<Landing />} />} />

        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />

        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </>
  );
};

export default App;
