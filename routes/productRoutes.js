const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.post("/", productController.createProduct);

router.get("/", productController.getProducts);

router.get("/date-range", productController.getProductsByDateRange);

router.post("/add-timestamps", productController.addTimestampsToAllProducts);

router.get("/:id", productController.getProductById);

router.put("/:id", productController.updateProduct);

router.delete("/:id", productController.deleteProduct);

module.exports = router;

