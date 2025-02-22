const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address1: String,
  address2: String,
  address3: String,
  city: String,
  state: String,
  country: String,
  pinCode: String,
  gst: String,
  profilePhoto: String,
});

module.exports = mongoose.model("User", UserSchema);
