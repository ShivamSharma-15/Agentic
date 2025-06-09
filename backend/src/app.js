const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
const adminRoutes = require("./routes/route");
app.use("/", adminRoutes);
const path = require("path");
app.use(express.static(path.join(__dirname, "..", "..", "frontend")));
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
