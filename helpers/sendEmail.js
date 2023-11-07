const nodemailer = require("nodemailer");
require("dotenv").config();

const { SMTP_USER, SMTP_PASS, SENDER_EMAIL } = process.env;

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function sendEmail(message) {
  message.from = SENDER_EMAIL;

  return transport.sendMail(message);
}

module.exports = sendEmail;
