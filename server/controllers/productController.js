// src/controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const bufferUpload = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(
      cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: folder },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        }
      )
    );
  });
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { pincode } = req.query;
    const filter = pincode ? { 'pincodePricing.pincode': pincode } : {};
    filter.isActive = { $ne: false };
    const products = await Product.find(filter).populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.isActive = false;
    await product.save();
    res.json({ message: 'Product marked as deactivated' });
  } catch (error) {
    console.error('Backend Error during product deletion:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createProduct = async (req, res) => {
  const {
    name,
    description,
    brand,
    category,
    gender,
    subCategory,
    variants,
    isFeatured,
    isBestseller,
    videoUrl,
    isComingSoon,
    farmerName,
    farmerPhone,
    farmerLocation,
    farmerEmail,
    pincodePricing,
  } = req.body;

  if (!category || !gender) {
    return res.status(400).json({ message: 'Category and gender are required.' });
  }

  try {
    const fileUrls = [];
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const result = await bufferUpload(file.buffer, process.env.CLOUDINARY_FOLDER);
        fileUrls.push(result.secure_url);
      }
    }

    let uploadedVideoUrl = videoUrl;
    if (req.files && req.files.video) {
      const videoResult = await bufferUpload(req.files.video[0].buffer, process.env.CLOUDINARY_FOLDER);
      uploadedVideoUrl = videoResult.secure_url;
    }

    const product = new Product({
      name,
      description,
      brand,
      category,
      gender,
      subCategory,
      images: fileUrls,
      variants: JSON.parse(variants),
      pincodePricing: pincodePricing ? JSON.parse(pincodePricing) : [],
      videoUrl: uploadedVideoUrl,
      farmerName,
      farmerPhone,
      farmerLocation,
      farmerEmail,
      isComingSoon: isComingSoon === 'true' || isComingSoon === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isBestseller: isBestseller === 'true' || isBestseller === true,
    });

    const createdProduct = await product.save();
    res.status(201).json({
      message: 'Product created successfully',
      product: createdProduct,
    });
  } catch (error) {
    console.error('Backend Error during product creation:', error);
    res.status(500).json({ message: 'Failed to create product', error });
  }
};

exports.updateProduct = async (req, res) => {
  const {
    name,
    description,
    brand,
    category,
    gender,
    subCategory,
    variants,
    isFeatured,
    isBestseller,
    videoUrl,
    isComingSoon,
    farmerName,
    farmerPhone,
    farmerLocation,
    farmerEmail,
    pincodePricing,
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let fileUrls = [];
    if (req.body.existingImages) {
      fileUrls = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages];
    }

    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const result = await bufferUpload(file.buffer, process.env.CLOUDINARY_FOLDER);
        fileUrls.push(result.secure_url);
      }
    }

    let updatedVideoUrl = videoUrl !== undefined ? videoUrl : product.videoUrl;
    if (req.files && req.files.video) {
      const videoResult = await bufferUpload(req.files.video[0].buffer, process.env.CLOUDINARY_FOLDER);
      updatedVideoUrl = videoResult.secure_url;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.brand = brand || product.brand;
    // Only overwrite category with a valid ObjectId; ignore empty/"undefined"/name values
    if (category && mongoose.isValidObjectId(category)) {
      product.category = category;
    }
    product.gender = gender || product.gender;
    product.subCategory = subCategory || product.subCategory;
    product.images = fileUrls;
    product.variants = variants ? JSON.parse(variants) : product.variants;
    product.pincodePricing = pincodePricing ? JSON.parse(pincodePricing) : product.pincodePricing;
    product.videoUrl = updatedVideoUrl;
    product.farmerName = farmerName !== undefined ? farmerName : product.farmerName;
    product.farmerPhone = farmerPhone !== undefined ? farmerPhone : product.farmerPhone;
    product.farmerLocation = farmerLocation !== undefined ? farmerLocation : product.farmerLocation;
    product.farmerEmail = farmerEmail !== undefined ? farmerEmail : product.farmerEmail;
    product.isComingSoon = isComingSoon !== undefined ? (isComingSoon === 'true' || isComingSoon === true) : product.isComingSoon;
    product.isFeatured = isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : product.isFeatured;
    product.isBestseller = isBestseller !== undefined ? (isBestseller === 'true' || isBestseller === true) : product.isBestseller;

    const updatedProduct = await product.save();
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Backend Error during product update:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { pincode } = req.query;
    const filter = { category: req.params.categoryId, isActive: { $ne: false } };
    if (pincode) filter['pincodePricing.pincode'] = pincode;

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductsBySubCategory = async (req, res) => {
  const { subCategory } = req.params;
  const { pincode } = req.query;

  const filter = { subCategory, isActive: { $ne: false } };
  if (pincode) filter['pincodePricing.pincode'] = pincode;

  const products = await Product.find(filter)
    .populate('category', 'name')
    .exec();

  if (!products || products.length === 0) {
    res.status(404);
    throw new Error('No products found for this subcategory');
  }

  res.json(products);
};

exports.getProductsByGender = async (req, res) => {
  try {
    const { pincode } = req.query;
    const filter = { gender: req.params.gender, isActive: { $ne: false } };
    if (pincode) filter['pincodePricing.pincode'] = pincode;

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const { pincode } = req.query;
    const filter = { isFeatured: true, isActive: { $ne: false } };
    if (pincode) filter['pincodePricing.pincode'] = pincode;

    const products = await Product.find(filter).populate('category', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBestsellerProducts = async (req, res) => {
  try {
    const { pincode } = req.query;
    const filter = { isBestseller: true, isActive: { $ne: false } };
    if (pincode) filter['pincodePricing.pincode'] = pincode;

    const products = await Product.find(filter).populate('category', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUpcomingProducts = async (req, res) => {
  try {
    const { pincode } = req.query;
    const filter = { isComingSoon: true, isActive: { $ne: false } };
    if (pincode) filter['pincodePricing.pincode'] = pincode;

    const products = await Product.find(filter).populate('category', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentProducts = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const { pincode } = req.query;

  const filter = { isComingSoon: { $ne: true }, isActive: { $ne: false } };
  if (pincode) filter['pincodePricing.pincode'] = pincode;

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name')
    .exec();

  res.json(products);
};

exports.searchProducts = async (req, res) => {
  const { keyword, pincode } = req.query;
  if (!keyword) {
    return res.status(400).json({ message: 'Search keyword is required' });
  }

  try {
    const regex = new RegExp(keyword, 'i');
    const searchFilter = {
      $or: [
        { name: { $regex: regex } },
        { brand: { $regex: regex } },
        { subCategory: { $regex: regex } },
        { gender: { $regex: regex } }
      ],
      isActive: { $ne: false }
    };

    let finalFilter = searchFilter;
    if (pincode) {
      finalFilter = {
        $and: [searchFilter, { 'pincodePricing.pincode': pincode }]
      };
    }

    const products = await Product.find(finalFilter).populate('category');
    res.json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: error.message });
  }
};
