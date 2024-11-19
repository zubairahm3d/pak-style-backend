const express = require("express");
const router = express.Router();
const designerController = require("../controllers/designerController");

router.post("/", designerController.createDesigner);

router.get("/", designerController.getDesigners);

router.get("/:id", designerController.getDesignerById);

router.put("/:id", designerController.updateDesigner);

router.delete("/:id", designerController.deleteDesigner);

module.exports = router;
