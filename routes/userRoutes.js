const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

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

router.get("/", userController.getUsers); 
router.get("/:id", userController.getUserById); 
router.put("/:id", userController.updateUser); 
router.delete("/:id", userController.deleteUser); 

router.get("/:id/unread-messages-count", userController.getTotalUnreadMessagesCount);

module.exports = router;

