const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const User = require("../models/userModel");
const cloudinary = require("../cloudinaryConfig");
const path = require("path");
const isUrl = require("is-url");
const multer = require("multer");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Configure multer for file uploads
// const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/tmp')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  })
}).single('profilePicture');

async function createUser(req, res) {
  try {
    const userId = uuid.v4();
    const hashedPassword = await bcrypt.hash(req.body.password, 10); // 10 is the salt rounds
    const hashedConfirmedPassword = await bcrypt.hash(
      req.body.passwordConfirm,
      10
    );

    // Default profile picture URL
    const defaultProfilePicture =
      "https://res.cloudinary.com/drhzmuvil/image/upload/v1726947332/profile_pictures/fp6pmmmtbc5xcgiiukhp.png";

    const userBody = {
      ...req.body,
      userId: userId,
      password: hashedPassword,
      passwordConfirm: hashedConfirmedPassword,
      profilePicture: defaultProfilePicture, // Use the provided picture or default one
    };

    const newUser = await User.create(userBody);
    res.json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expires in 1 hour
    });

    // Respond with token
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

async function brandApproval(req, res) {
  const { id, status } = req.body;

  try {
    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.GMAIL_USER, // Use environment variables for security
        pass: process.env.GMAIL_PASS,
      },
    });

    // Find user by ID to get the email
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found.",
      });
    }

    if (status === "accept") {
      // Update user's status to 'active'
      user.status = "active";
      await user.save();

      // Prepare the email options
      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Pak Style Brand Account Activation",
        text: `Dear ${user.name},\n\nYour brand account has been activated successfully. You can now log in using your email and password.\n\nBest regards,\nPak Style Team`,
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        status: "success",
        message: "Brand account approved successfully. Email sent.",
        user,
      });
    } else if (status === "reject") {
      // Remove the user from the database
      await User.findByIdAndDelete(id);

      // Prepare the email options for rejection
      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Pak Style Brand Account Rejection",
        text: `Dear ${user.name},\n\nWe regret to inform you that your brand account cannot be created at this time. Please try again later.\n\nBest regards,\nPak Style Team`,
      };

      // Send the rejection email
      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        status: "success",
        message:
          "Brand account rejected and removed successfully. Rejection email sent.",
      });
    } else {
      return res.status(400).json({
        status: "failed",
        message: "Invalid status provided.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while processing the request.",
    });
  }
}

async function changePassword(req, res) {
  const { id, password, newPassword, confirmNewPassword } = req.body;
  console.log(id);
  try {
    // Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the old password matches the stored password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect old password" });
    }

    // Check if the new password matches the confirm password field
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedNewPassword;

    // Optionally, rehash the passwordConfirm field (if still needed in your model)
    user.passwordConfirm = await bcrypt.hash(confirmNewPassword, 10);

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

async function getUsers(req, res) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
}

async function updateUser(req, res) {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
}

async function deleteUser(req, res) {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
}

async function changeProfilePic(req, res) {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: "Multer error", error: err });
    } else if (err) {
      return res.status(500).json({ message: "Unknown error", error: err });
    }

    try {
      const { email } = req.body;

      // Find the user by email
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pictures",
      });

      // Update the profile picture link with the URL from Cloudinary
      user.profilePicture = result.secure_url;

      // Save the updated user
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        url: result.secure_url,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  });
}
const uploadPortfolioImages = async (req, res) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, '/tmp')
      },
      filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
      }
    })
  }).array('portfolioImages', 10); // Allow up to 10 images

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: "Multer error", error: err });
    } else if (err) {
      return res.status(500).json({ message: "Unknown error", error: err });
    }

    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Upload each image to Cloudinary and collect URLs
      const uploadPromises = req.files.map(file => 
        cloudinary.uploader.upload(file.path, {
          folder: "portfolio_images"
        })
      );

      const results = await Promise.all(uploadPromises);
      const imageUrls = results.map(result => result.secure_url);

      // Add new images to the user's portfolio
      user.portfolioImages = [...(user.portfolioImages || []), ...imageUrls];
      await user.save();

      res.status(200).json({
        success: true,
        message: "Portfolio images uploaded successfully",
        urls: imageUrls
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Internal server error", 
        error: error.message 
      });
    }
  });
};

const removePortfolioImage = async (req, res) => {
  try {
    const { email, imageUrl } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.portfolioImages = user.portfolioImages.filter(url => url !== imageUrl);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Image removed successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

const getDesignerPortfolio = async (req, res) => {
  try {
    const designer = await User.findById(req.params.id);
    
    if (!designer) {
      return res.status(404).json({ 
        message: "Designer not found" 
      });
    }

    res.status(200).json({
      success: true,
      portfolioImages: designer.portfolioImages || []
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

module.exports = {
  createUser,
  login,
  changePassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeProfilePic,
  brandApproval,
  uploadPortfolioImages,
  removePortfolioImage,
  getDesignerPortfolio
};
