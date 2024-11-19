
// customOrderRoutes.js
const express = require("express");
const router = express.Router();
const customOrderController = require("../controllers/customOrderController");

// Base route: /api/custom-orders

// Create new custom order
router.post("/", customOrderController.createCustomOrder);

// Get all custom orders (with optional filters)
router.get("/", customOrderController.getCustomOrders);

// Get single custom order
router.get("/:id", customOrderController.getCustomOrderById);

// Update custom order
router.put("/:id", customOrderController.updateCustomOrder);

// Delete custom order
router.delete("/:id", customOrderController.deleteCustomOrder);

// Update order status
router.patch("/:id/status", customOrderController.updateOrderStatus);

module.exports = router;