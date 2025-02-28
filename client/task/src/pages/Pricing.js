import React from "react";
import "./Pricing.css";
import { motion } from "framer-motion";

const Pricing = () => {
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
            description: "Ideal for individuals getting started.",
            features: [
              "AI-Generated Docs (Limited)",
              "GitHub Integration (1 Repo)",
              "Basic API Reference Docs",
              "Export as Markdown",
              "Community Support",
            ],
          },
          {
            title: "Pro Plan",
            price: "₹799/month",
            description: "Best for developers and small teams.",
            features: [
              "AI-Generated Docs (Unlimited)",
              "GitHub Sync (Up to 10 Repos)",
              "Interactive API Explorer",
              "Export as PDF & Markdown",
              "Priority Support (Email)",
            ],
          },
          {
            title: "Enterprise Plan",
            price: "₹1,999/month",
            description: "For large teams & organizations.",
            features: [
              "AI-Generated Docs (Unlimited)",
              "GitHub Sync (Unlimited Repos)",
              "Private Documentation Hosting",
              "Role-Based Access Control",
              "24/7 Dedicated Support",
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
            >
              {plan.title === "Free Plan" ? "Activated" : "Get Started"}
            </motion.button>

            <br />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
