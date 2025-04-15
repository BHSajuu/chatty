import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./emailTemplates.js";

console.log("SMTP_USER in emails.js:", process.env.SMTP_USER);
console.log("SMTP_PASS in emails.js:", process.env.SMTP_PASS);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (email, resetURL) => {
  console.log("resetURL:", resetURL);
  const emailContent = PASSWORD_RESET_REQUEST_TEMPLATE.replace(
    "{resetURL}",
    resetURL
  );
  console.log("Email Content:", emailContent);

  try {
    await transporter.sendMail({
      from: `"Chatty Technical Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset your password",
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

export const sendResetSuccessEmail = async (email) => {
  try {
    await transporter.sendMail({
      from: `"Chatty Technical Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });
  } catch (error) {
    console.error("Error sending password reset success email:", error);
  }
};
