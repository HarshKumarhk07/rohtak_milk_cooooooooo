// src/controllers/userController.js
const User = require('../models/User');

// @desc    Get the logged-in user's profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('getMe failed:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update the logged-in user's profile (name, phone, default address)
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, address } = req.body;
    if (name !== undefined) user.name = String(name).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (address !== undefined) {
      user.address = {
        address: String(address.address || '').trim(),
        city: String(address.city || '').trim(),
        postalCode: String(address.postalCode || '').trim(),
      };
    }

    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json({ message: 'Profile updated successfully', user: safe });
  } catch (error) {
    console.error('updateMe failed:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all users with the 'delivery' role
// @route   GET /api/users/delivery-partners
// @access  Private/Admin
exports.getAllDeliveryPartners = async (req, res) => {
  try {
    const deliveryPartners = await User.find({ role: 'delivery' }).select('-password');
    res.json(deliveryPartners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find({}).select('-password');
//     res.json(users);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// controllers/userController.js
;

exports.getAllUsers = async (req, res) => {
  try {
    console.log("👤 [GET ALL USERS] Request by:", req.user?.email, "Role:", req.user?.role);
    const users = await User.find({});
    console.log("✅ Users found:", users.length);
    res.json(users);
  } catch (err) {
    console.error("❌ Error in getAllUsers:", err.message);
    res.status(500).json({ message: err.message });
  }
};




exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error at delete' });
  }
};
