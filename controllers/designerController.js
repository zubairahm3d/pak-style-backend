const Designer = require("../models/designerModel");

async function createDesigner(req, res) {
  try {
    const newDesigner = await Designer.create(req.body);
    res.json(newDesigner);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function getDesigners(req, res) {
  try {
    const designers = await Designer.find();
    res.json(designers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getDesignerById(req, res) {
  try {
    const designer = await Designer.findById(req.params.id);
    res.json(designer);
  } catch (error) {
    res.status(404).json({ error: "Designer not found" });
  }
}

async function updateDesigner(req, res) {
  try {
    const updatedDesigner = await Designer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedDesigner);
  } catch (error) {
    res.status(404).json({ error: "Designer not found" });
  }
}

async function deleteDesigner(req, res) {
  try {
    await Designer.findByIdAndDelete(req.params.id);
    res.json({ message: "Designer deleted successfully" });
  } catch (error) {
    res.status(404).json({ error: "Designer not found" });
  }
}

module.exports = {
  createDesigner,
  getDesigners,
  getDesignerById,
  updateDesigner,
  deleteDesigner,
};
