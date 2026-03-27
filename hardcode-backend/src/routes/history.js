const express = require("express");
const router = express.Router();
const history = require("../modules/history");

// Gets the user's own history
router.get("/:userId", (req, res) => {
  return res.json(history.getUserHistory(Number(req.params.userId)));
});

// Admin gets to check all history of all users
router.get("/", (req, res) => {
  return res.json(history.getAllHistory());
});

module.exports = router;
