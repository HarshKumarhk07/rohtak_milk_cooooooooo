const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('No MongoDB URI found in environment (.env).');
      process.exit(1);
    }

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' }).select('_id name email role createdAt').lean();
    if (!admins || admins.length === 0) {
      console.log('No admin users found.');
    } else {
      console.log('Admin users found:');
      console.log(JSON.stringify(admins, null, 2));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err.message || err);
    process.exit(1);
  }
})();
