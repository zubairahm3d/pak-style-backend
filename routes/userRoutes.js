const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

// // Routes
// router.post("/", userController.createUser);
// router.post("/login", userController.login); // Add login route
// router.get("/", authMiddleware, userController.getUsers); // Apply authMiddleware
// router.get("/:id", authMiddleware, userController.getUserById); // Apply authMiddleware
// router.put("/:id", authMiddleware, userController.updateUser); // Apply authMiddleware
// router.delete("/:id", authMiddleware, userController.deleteUser); // Apply authMiddleware

// Routes

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/reset-password", authController.reset);

router.post("/change-profile-pic", userController.changeProfilePic);
router.post("/change-password", userController.changePassword);

router.post("/brand-approval", userController.brandApproval);


router.get("/portfolio/:id", userController.getDesignerPortfolio);
router.post("/upload-portfolio", userController.uploadPortfolioImages);
router.post("/remove-portfolio-image", userController.removePortfolioImage);

// router.post("/", userController.createUser);
// router.post("/login", userController.login); // Add login route
router.get("/", userController.getUsers); // Apply authMiddleware
router.get("/:id", userController.getUserById); // Apply authMiddleware
router.put("/:id", userController.updateUser); // Apply authMiddleware
router.delete("/:id", userController.deleteUser); // Apply authMiddleware

module.exports = router;
