import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Pricing.css";
import { motion } from "framer-motion";

const Pricing = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("token");

  const [currentPlan, setCurrentPlan] = useState("Free Plan");
  const [Imports, setCurrentImports] = useState(0);

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
      .then((res) => {
        setCurrentPlan(res.data.currentPlan || "Free Plan");
        setCurrentImports(res.data.Imports);
      })
      .catch((err) => console.error("Error fetching plan:", err));
  }, [userId]);

  const handlePlanSelection = (plan) => {

    if (plan === "Pro Plan" && Imports >= 10) {
      alert("You have already imported 10 repositories. Upgrade to Enterprise Plan to import more.");
      return; 
    }
  
    if (!isAuthenticated) {
      navigate("/register");
    } else if (plan === "Free Plan" || plan === currentPlan) {
      alert(`${plan} is always active!`);
    } else {
      handlePayment(plan);
    }
  };
  

  const handlePayment = async (plan) => {
    const planPrices = {
      "Pro Plan": 499,
      "Enterprise Plan": 1499,
    };

    const amount = planPrices[plan];

    try {
      const keyResponse = await fetch(
        "https://sooru-ai.onrender.com/get-razorpay-key"
      );
      const { key } = await keyResponse.json();

      const response = await fetch(
        "https://sooru-ai.onrender.com/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, currency: "INR" }),
        }
      );

      const data = await response.json();
      if (!data.orderId) {
        alert("Failed to create payment order.");
        return;
      }

      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "Docufy.Ai",
        description: `${plan} Subscription`,
        order_id: data.orderId,

        handler: async function (response) {
          try {
            const verifyResponse = await fetch(
              "https://sooru-ai.onrender.com/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  userId,
                  plan,
                }),
              });

            const verifyData = await verifyResponse.json();
            if (verifyResponse.ok && verifyData.success) {
              alert(
                `Payment Successful! Payment ID: ${response.razorpay_payment_id}`
              );
              updatePlan(plan);
            } else {
              alert("Payment verification failed.");
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert("Payment verification error.");
          }
        },

        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "9999999999",
        },
        theme: { color: "#000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed!");
    }
  };

  const updatePlan = async (plan) => {
    if (!userId) return;

    const updatedPlan =
      plan === "Pro Plan"
        ? "Pro Plan (₹499/month)"
        : "Enterprise Plan (₹1,499/month)";

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); 

    try {
      const response = await axios.put(
        `https://sooru-ai.onrender.com/api/user/${userId}`,
        {
          currentPlan: updatedPlan
        }
      );

      if (response.status === 200) {
        setCurrentPlan(updatedPlan);
      } else {
        console.error("Failed to update plan:", response.data);
        alert("Failed to update your subscription.");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("An error occurred while updating your plan.");
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
              "GitHub Sync (1 Repo)",
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
              onClick={() => handlePlanSelection(plan.title)}
              disabled={currentPlan.includes(plan.title)}
              style={
                currentPlan.includes(plan.title)
                  ? { backgroundColor: "gray", cursor: "not-allowed" }
                  : {}
              }
            >
              {plan.title === "Free Plan" || currentPlan.includes(plan.title)
                ? "Activated"
                : "Upgrade Plan"}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
