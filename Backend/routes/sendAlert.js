const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const cooldown = require("./emailCooldown"); // import cooldown tracker

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EMAIL_INTERVAL = 15 * 60 * 1000; // 15 min in ms

router.post("/send-alert", async (req, res) => {
  const now = Date.now();
  const lastTime = cooldown.getLastEmailTime();

  if (now - lastTime > EMAIL_INTERVAL) {
    const mailOptions = {
      from: `"Weapon Alert" <${process.env.EMAIL_USER}>`,
      to: process.env.TO_EMAIL,
      subject: "⚠️ Weapon Detected!",
      text: "A weapon has been detected. Please take necessary action.",
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully.");
      cooldown.updateLastEmailTime(now); // ✅ Update global time
      res.status(200).send("Email sent!");
    } catch (err) {
      console.error("Email send error:", err);
      res.status(500).send("Failed to send email.");
    }
  } else {
    console.log("⏳ Cooldown: Email not sent (15-min interval).");
    res.status(200).send("Email not sent. Still in cooldown period.");
  }
});

module.exports = router;
