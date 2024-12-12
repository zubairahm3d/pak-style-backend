const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const User = require("../models/userModel");
const Conversation = require("../models/conversationModel");
const cloudinary = require("../cloudinaryConfig");
const path = require("path");
const isUrl = require("is-url");
const multer = require("multer");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Configure multer for file uploads
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
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const hashedConfirmedPassword = await bcrypt.hash(req.body.passwordConfirm, 10);

    const defaultProfilePicture = "https://res.cloudinary.com/drhzmuvil/image/upload/v1726947332/profile_pictures/fp6pmmmtbc5xcgiiukhp.png";

    const userBody = {
      ...req.body,
      userId: userId,
      password: hashedPassword,
      passwordConfirm: hashedConfirmedPassword,
      profilePicture: defaultProfilePicture,
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
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

async function brandApproval(req, res) {
  const { id, status } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found.",
      });
    }

    if (status === "accept") {
      user.status = "active";
      await user.save();

      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Pak Style Brand Account Activation",
        text: `Dear ${user.name},\n\nYour brand account has been activated successfully. You can now log in using your email and password.\n\nBest regards,\nPak Style Team`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        status: "success",
        message: "Brand account approved successfully. Email sent.",
        user,
      });
    } else if (status === "reject") {
      await User.findByIdAndDelete(id);

      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Pak Style Brand Account Rejection",
        text: `Dear ${user.name},\n\nWe regret to inform you that your brand account cannot be created at this time. Please try again later.\n\nBest regards,\nPak Style Team`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        status: "success",
        message: "Brand account rejected and removed successfully. Rejection email sent.",
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
  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect old password" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedNewPassword;
    user.passwordConfirm = await bcrypt.hash(confirmNewPassword, 10);

    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
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

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pictures",
      });

      user.profilePicture = result.secure_url;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        url: result.secure_url,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
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
  }).array('portfolioImages', 10);

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

      const uploadPromises = req.files.map(file => 
        cloudinary.uploader.upload(file.path, {
          folder: "portfolio_images"
        })
      );

      const results = await Promise.all(uploadPromises);
      const imageUrls = results.map(result => result.secure_url);

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

async function startConversation(req, res) {
  try {
    const { userId, recipientId, message } = req.body;

    const conversation = new Conversation({
      participants: [userId, recipientId],
      messages: [{
        sender: userId,
        content: message
      }]
    });

    await conversation.save();

    await User.updateMany(
      { _id: { $in: [userId, recipientId] } },
      { $push: { conversations: conversation._id } }
    );

    await User.findByIdAndUpdate(recipientId, { $inc: { unreadMessages: 1 } });

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function sendMessage(req, res) {
  try {
    const { userId, conversationId, message } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation.messages.push({
      sender: userId,
      content: message
    });
    conversation.lastMessage = Date.now();
    await conversation.save();

    const recipient = conversation.participants.find(p => p.toString() !== userId);
    await User.findByIdAndUpdate(recipient, { $inc: { unreadMessages: 1 } });

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversations(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate({
      path: 'conversations',
      populate: {
        path: 'participants',
        select: 'name profilePicture'
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user.conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId).populate({
      path: 'messages.sender',
      select: 'name profilePicture'
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.status(200).json(conversation.messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function markMessagesAsRead(req, res) {
  try {
    const { userId, conversationId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation.messages.forEach(message => {
      if (message.sender.toString() !== userId && !message.read) {
        message.read = true;
      }
    });
    await conversation.save();

    await User.findByIdAndUpdate(userId, { unreadMessages: 0 });

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTotalUnreadMessagesCount(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate total unread messages across all conversations
    const conversations = await Conversation.find({ participants: userId });
    let totalUnreadCount = 0;

    for (const conversation of conversations) {
      const unreadCount = conversation.messages.filter(
        message => message.sender.toString() !== userId && !message.read
      ).length;
      totalUnreadCount += unreadCount;
    }

    res.status(200).json({ count: totalUnreadCount });
  } catch (error) {
    console.error('Error getting total unread messages count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

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
  getDesignerPortfolio,
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  markMessagesAsRead,
  getTotalUnreadMessagesCount
};

