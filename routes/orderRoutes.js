const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);
router.post("/:id", orderController.updateOrderStatus);
router.get("/:id", orderController.getOrderById);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);
router.post("/:orderId/confirm-payment", orderController.confirmPayment);

module.exports = router;

