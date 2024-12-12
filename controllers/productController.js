const Product = require("../models/productModel");
const cloudinary = require("../cloudinaryConfig");
const multer = require("multer");
const path = require("path");

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/tmp')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  })
}).single('image');

async function createProduct(req, res) {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: "Multer error", error: err });
    } else if (err) {
      return res.status(500).json({ message: "Unknown error", error: err });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "product_images",
      });

      const productData = {
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        category: req.body.category,
        sizes: JSON.parse(req.body.sizes),
        colors: JSON.parse(req.body.colors),
        images: [result.secure_url],
        brandId: req.body.brandId,
        brandName: req.body.brandName,
      };

      const newProduct = new Product(productData);
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}

async function getProducts(req, res) {
  try {
    const { brandId, startDate, endDate } = req.query;
    let query = brandId ? { brandId } : {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getProductsByDateRange(req, res) {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    const products = await Product.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(404).json({ error: "Product not found" });
  }
}

async function updateProduct(req, res) {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedProduct);
  } catch (error) {
    res.status(404).json({ error: "Product not found" });
  }
}

async function deleteProduct(req, res) {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(404).json({ error: "Product not found" });
  }
}

async function addTimestampsToAllProducts(req, res) {
  try {
    const result = await Product.updateMany(
      { createdAt: { $exists: false } },
      { $set: { createdAt: new Date(), updatedAt: new Date() } }
    );
    res.json({ message: `Updated ${result.modifiedCount} products with timestamps.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductsByDateRange,
  getProductById,
  updateProduct,
  deleteProduct,
  addTimestampsToAllProducts,
};

