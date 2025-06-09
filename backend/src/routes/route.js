const { rootController } = require("../controllers/root");
const express = require("express");
const router = express.Router();
const path = require("path");

router.post("/chat", rootController);

module.exports = router;
