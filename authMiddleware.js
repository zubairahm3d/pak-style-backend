// authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("./models/userModel");

const authMiddleware = async (req, res, next) => {
  // Check if Authorization header is present
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Extract token from Authorization header
  const token = authHeader.split(" ")[1];

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by userId from decoded token
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach user object to request for further processing
    req.user = user;

    // Move to the next middleware
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = authMiddleware;
