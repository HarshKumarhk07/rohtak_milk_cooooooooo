const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Paneer image hosted alongside the other dairy stock images.
const paneerCategory = {
    name: "Paneer",
    image: "https://images.pexels.com/photos/20379604/pexels-photo-20379604.jpeg?cs=srgb&dl=pexels-royalrouge-20379604.jpg&fm=jpg"
};

const addPaneer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await Category.findOneAndUpdate(
            { name: paneerCategory.name },
            { name: paneerCategory.name, image: paneerCategory.image },
            { upsert: true, new: true }
        );
        console.log(`Added/Updated Category: ${paneerCategory.name}`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

addPaneer();
