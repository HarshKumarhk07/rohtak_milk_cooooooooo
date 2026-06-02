// Seeds the 6 core dairy products (with categories) into MongoDB.
// Idempotent: safe to run multiple times — it upserts by name.
// Run:  node scripts/seedDairyProducts.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Verified real, professional product photos.
const IMG = {
  cow: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
  buffalo: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=800',
  toned: 'https://images.pexels.com/photos/1435706/pexels-photo-1435706.jpeg?auto=compress&cs=tinysrgb&w=800',
  buttermilk: 'https://images.pexels.com/photos/4475024/pexels-photo-4475024.jpeg?auto=compress&cs=tinysrgb&w=800',
  curd: 'https://images.pexels.com/photos/6808666/pexels-photo-6808666.jpeg?auto=compress&cs=tinysrgb&w=800',
  ghee: 'https://images.pexels.com/photos/12426032/pexels-photo-12426032.jpeg?auto=compress&cs=tinysrgb&w=800',
};

// Categories to ensure exist (Category.image is required).
const CATEGORIES = [
  { name: 'Milk', image: IMG.cow },
  { name: 'Curd', image: IMG.curd },
  { name: 'Buttermilk', image: IMG.buttermilk },
  { name: 'Ghee', image: IMG.ghee },
];

// Default delivery area used so products are "Available" out of the box.
const PINCODE = '124001';
const LOCATION = 'Rohtak';

// price/original let the UI show a small discount; final price matches the
// market value the user requested.
const PRODUCTS = [
  {
    name: 'Cow Milk - 1L', category: 'Milk', brand: 'Rohtak Milk Company', gender: 'standard',
    description: 'Farm-fresh pure cow milk, pasteurized and delivered daily. Light, easily digestible and rich in calcium.',
    image: IMG.cow, size: '1L', price: 60, originalPrice: 66, stock: 100,
  },
  {
    name: 'Buffalo Milk - 1L', category: 'Milk', brand: 'Rohtak Milk Company', gender: 'standard',
    description: 'Thick and creamy buffalo milk with naturally high fat content — perfect for tea, kheer and rich sweets.',
    image: IMG.buffalo, size: '1L', price: 80, originalPrice: 88, stock: 100,
  },
  {
    name: 'Toned Milk - 1L', category: 'Milk', brand: 'Rohtak Milk Company', gender: 'standard',
    description: 'Toned milk with balanced fat for an everyday healthy choice. Fresh, hygienic and home-delivered.',
    image: IMG.toned, size: '1L', price: 54, originalPrice: 60, stock: 100,
  },
  {
    name: 'Buttermilk - 1L', category: 'Buttermilk', brand: 'Rohtak Milk Company', gender: 'standard',
    description: 'Refreshing traditional chaas (buttermilk), lightly spiced and churned from fresh curd. Great for digestion.',
    image: IMG.buttermilk, size: '1L', price: 40, originalPrice: 45, stock: 80,
  },
  {
    name: 'Fresh Curd - 1kg', category: 'Curd', brand: 'Rohtak Milk Company', gender: 'standard',
    description: 'Thick, set dahi made fresh from pure milk. Creamy, naturally probiotic and perfect for everyday meals.',
    image: IMG.curd, size: '1kg', price: 90, originalPrice: 100, stock: 80,
  },
  {
    name: 'Pure Cow Ghee - 1L', category: 'Ghee', brand: 'Rohtak Milk Company', gender: 'premium',
    description: 'Aromatic pure cow ghee, slow-cooked the traditional way using the bilona method. Rich golden grain and aroma.',
    image: IMG.ghee, size: '1L', price: 650, originalPrice: 720, stock: 50,
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure categories exist, keep a name -> _id map.
    const categoryMap = {};
    for (const c of CATEGORIES) {
      let cat = await Category.findOne({ name: c.name });
      if (!cat) {
        cat = await Category.create(c);
        console.log(`Created category: ${c.name}`);
      } else if (!cat.image) {
        cat.image = c.image;
        await cat.save();
      }
      categoryMap[c.name] = cat._id;
    }

    // 2. Upsert products by name.
    for (const p of PRODUCTS) {
      const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      const variant = {
        size: p.size, price: p.price, originalPrice: p.originalPrice, discount, countInStock: p.stock,
      };
      const pincodePricing = [{
        pincode: PINCODE, location: LOCATION, size: p.size,
        price: p.price, originalPrice: p.originalPrice, discount, inventory: p.stock,
      }];

      let product = await Product.findOne({ name: p.name });
      if (product) {
        product.description = p.description;
        product.brand = p.brand;
        product.category = categoryMap[p.category];
        product.gender = p.gender;
        product.images = [p.image];
        product.variants = [variant];
        product.pincodePricing = pincodePricing;
        product.isActive = true;
        await product.save();
        console.log(`Updated product: ${p.name}`);
      } else {
        product = new Product({
          name: p.name,
          description: p.description,
          brand: p.brand,
          category: categoryMap[p.category],
          gender: p.gender,
          images: [p.image],
          variants: [variant],
          pincodePricing,
          isActive: true,
        });
        await product.save();
        console.log(`Created product: ${p.name}`);
      }
    }

    console.log('\nSeed complete. Products are available for pincode', PINCODE);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message || err);
    process.exit(1);
  }
})();
