const express = require("express");
const cors = require("cors");
const router = express.Router();
const authController = require("../controllers/authcontroller");

router.use(
    cors({
      origin: ["https://spark2.netlify.app"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

router.post("/login", authController.login);  

router.post("/login/admin", authController.adminLogin);  

module.exports = router;
