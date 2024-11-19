// authController.js
const User = require("../models/userModel");
const uuid = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

exports.signup = async (req, res) => {
  try {
    const userId = uuid.v4();
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const hashedConfirmedPassword = undefined;

    // Default profile picture URL
    const defaultProfilePicture =
      "https://res.cloudinary.com/drhzmuvil/image/upload/v1726947332/profile_pictures/fp6pmmmtbc5xcgiiukhp.png";

    // Determine user status based on userType
    let status = "active"; // Default status for non-brand users
    if (req.body.userType === "brand") {
      status = "pending"; // Set status to pending for brand users
    }

    const userBody = {
      ...req.body,
      userId: userId,
      password: hashedPassword,
      passwordConfirm: hashedConfirmedPassword,
      profilePicture: defaultProfilePicture,
      status: status, // Set the status based on the userType
    };

    const newUser = await User.create(userBody);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        status: "failed",
        message: "Email or Password not provided.",
      });
    }

    // Find the user by email and include the password in the result
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid email or password.",
      });
    }

    // Check if the user's status is active
    if (user.status !== "active") {
      return res.status(403).json({
        status: "failed",
        message:
          "Your account is not active. Please contact support or wait for approval.",
      });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Send success response with the token and user details
    res.status(200).json({
      status: "success",
      token,
      userType: user.userType,
      id: user.id, // Include userType and id in the response
    });
  } catch (error) {
    // Handle any errors
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

// Helper function to generate a random password
const generateRandomPassword = (length) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0, n = charset.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

exports.reset = async (req, res) => {
  try {
    // Email and password from environment variables
    const email = process.env.GMAIL_USER;
    const password = process.env.GMAIL_PASS;
    const { recipientEmail } = req.body; // Expecting recipient email from request body

    // Find the user in the database
    const user = await User.findOne({ email: recipientEmail });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Generate a new random password
    const newPassword = generateRandomPassword(8);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save(); // Save the updated user object

    // Create the transporter object using SMTP settings
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: email,
        pass: password,
      },
    });

    // Setup email data
    const mailOptions = {
      from: email, // Sender address
      to: recipientEmail, // Recipient email
      subject: "Your New Pak Style Password", // Subject line
      text: `Your new password is: ${newPassword}`, // Plain text body
      html: `<p>Your new password is: <strong>${newPassword}</strong></p>`, // HTML body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Log the result and respond with success
    console.log("Email sent: " + info.response);

    res.status(200).json({
      status: "success",
      message: "New password sent successfully",
    });
  } catch (error) {
    console.error("Error resetting password: ", error);
    res.status(500).json({
      status: "fail",
      message: "Error resetting password",
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "failed",
        message: "The user belonging to this token no longer exists.",
      });
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: "failed",
        message: "User recently changed password! Please log in again.",
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({
      status: "failed",
      message: "Unauthorized access!",
    });
  }
};
