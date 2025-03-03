import React from "react";
import { useNavigate } from "react-router-dom";
import "./Pricing.css";
import { motion } from "framer-motion";

const Pricing = () => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem("token");

    const handlePlanSelection = () => {
        if (!isAuthenticated) {
          navigate("/register"); 
        } else {
          navigate("/home"); 
        }
      };

      
  return (
    <div className="pricing-page" style={{ position: "relative", top: "50px" }}>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Choose the Best Plan for You
      </motion.h1>
      <p className="pricing-subtitle">
        Simple, transparent pricing for individuals, teams, and enterprises.
      </p>

      <div className="pricing-cards">
        {[
          {
            title: "Free Plan",
            price: "₹0/month",
            description: "Great for individuals for getting started.",
            features: [
              "AI-Generated Docs (Limited)",
              "GitHub Integration (1 Repo)",
              "Versioned Documentation",
              "Interactive Chat Assistance",
            ],
          },
          {
            title: "Pro Plan",
            price: "₹499/month",
            description: "Best for developers and small teams.",
            features: [
              "AI-Generated Docs (Unlimited)",
              "GitHub Sync (Up to 10 Repos)",
              "Download as PDF",
              "All Free Plan features included",
            ],
          },
          {
            title: "Enterprise Plan",
            price: "₹1,499/month",
            description: "Best for large teams and organizations.",
            features: [
              "AI-Generated Docs (Unlimited)",
              "GitHub Sync (Unlimited Repos)",
              "Priority Support",
              "All Pro Plan features included",
            ],
          },
        ].map((plan, index) => (
          <motion.div
            key={index}
            className="pricing-card"
            whileHover={{ scale: 1.05 }}
          >
            <h2>{plan.title}</h2>
            <p className="pricing-price">{plan.price}</p>
            <p className="pricing-desc">{plan.description}</p>
            <ul>
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="pricing-btn"
              onClick={handlePlanSelection}
            >
              {plan.title === "Free Plan" ? "Activated" : "Upgrade Plan"}
            </motion.button>

            <br />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
