const Brand = require("../models/brandModel");

async function createBrand(req, res) {
  try {
    const newBrand = await Brand.create(req.body);
    res.json(newBrand);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function getBrands(req, res) {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getBrandById(req, res) {
  try {
    const brand = await Brand.findById(req.params.id);
    res.json(brand);
  } catch (error) {
    res.status(404).json({ error: "Brand not found" });
  }
}

async function updateBrand(req, res) {
  try {
    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedBrand);
  } catch (error) {
    res.status(404).json({ error: "Brand not found" });
  }
}

async function deleteBrand(req, res) {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(404).json({ error: "Brand not found" });
  }
}

module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
