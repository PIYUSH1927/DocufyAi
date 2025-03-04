const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, sparse: true },
  password: String,
  phone: String,
  currentPlan: String,
  planExpiry: { type: Date, default: null },

  githubId: { type: String, unique: true, sparse: true }, 
  username: { type: String },
  avatar: { type: String },
  accessToken: { type: String }, 

  currentPlan: { type: String, default: "Free Plan (₹0/month)" },
});


module.exports = mongoose.model("User", UserSchema);
