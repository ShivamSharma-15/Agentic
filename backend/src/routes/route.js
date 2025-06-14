const { rootController } = require("../controllers/root");
const express = require("express");
const router = express.Router();
const path = require("path");

router.post("/chat", rootController);
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "..", "frontend", "chat.html"));
});

module.exports = router;
