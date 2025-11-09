const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: false, // true for 465, false for other ports
  auth: {
    user: "bhargav.dev2003@gmail.com",
    pass: "xagzspcieuforanc",
  },
});

// Wrap in an async IIFE so we can use await.
const sendMail = async (to, subject, text, html) => {
  const info = await transporter.sendMail({
    from: 'bhargav.dev2003@gmail.com', // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: text, // plain‑text body
    html: html, // HTML body
  });

  console.log("Message sent:", info.messageId);
};

module.exports = sendMail;