const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(express.json());


app.use(
  cors({
    origin: ["http://localhost:3000", "https://your-frontend-domain.com"],
    methods: "GET,POST,PUT,DELETE",
    credentials: true, 
  })
);

mongoose
  .connect("mongodb+srv://padiapiyush12:padiapiyush12@cluster0.xfht4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
