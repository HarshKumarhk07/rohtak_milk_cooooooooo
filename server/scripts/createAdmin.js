const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

// Admin credentials (change before running in production).
const ADMIN_NAME = 'Administrator';
const ADMIN_EMAIL = 'admin@rohtakmilk.com';
const ADMIN_PASSWORD = 'Admin@123';

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email: ADMIN_EMAIL });
    if (user) {
      // Ensure role + password are set (password is re-hashed by the pre-save hook).
      user.role = 'admin';
      user.password = ADMIN_PASSWORD;
      await user.save();
      console.log(`Updated existing user to admin: ${ADMIN_EMAIL}`);
    } else {
      user = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        isVerified: true,
      });
      console.log(`Created admin user: ${ADMIN_EMAIL}`);
    }

    console.log('Login with:');
    console.log('  Email   :', ADMIN_EMAIL);
    console.log('  Password:', ADMIN_PASSWORD);
    console.log('  Secret  :', process.env.ADMIN_SECRET_CODE);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message || err);
    process.exit(1);
  }
})();
