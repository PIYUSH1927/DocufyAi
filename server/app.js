const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(express.json());


app.use(
  cors({
    origin: ["http://localhost:3000", "https://docufy-ai.vercel.app"],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"], 
    credentials: true, 
  })
);

app.options("*", cors());


mongoose
  .connect(process.env.MONGO_URI) // Use the environment variable
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
