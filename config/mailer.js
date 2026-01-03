const nodemailer = require("nodemailer");
require("dotenv").config(); // load .env from project root

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
  throw new Error("❌ GMAIL credentials not found in .env");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Gmail App Password
  },
});

// Verify connection once
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mailer verification failed:", error);
  } else {
    console.log("✅ Mailer is ready");
  }
});

// ✅ SIMPLE SEND FUNCTION
async function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: `"Liberty Trust Capital" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { transporter, sendEmail };
