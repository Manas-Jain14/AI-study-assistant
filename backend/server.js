require("dotenv").config();
const dns = require("dns");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Some networks/routers don't forward the DNS SRV lookups MongoDB Atlas needs,
// which makes mongoose.connect() fail with "querySrv ECONNREFUSED". Pointing
// Node at Google's public DNS for this app only works around that.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const documentRoutes = require("./routes/documentRoutes");
const questionRoutes = require("./routes/questionRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// All document and question routes live under /api
app.use("/api", documentRoutes);
app.use("/api", questionRoutes);

app.get("/", (req, res) => {
  res.json({ message: "AI Study Assistant API is running" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });
