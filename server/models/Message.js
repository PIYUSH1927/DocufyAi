const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  repoName: { type: String, required: true },
  type: { type: String, enum: ["user", "bot"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);
