const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String, // URL to image (Primary/Main image for backward compatibility)
        required: true
    },
    images: {
        type: [String], // Array of image URLs (up to 4)
        default: []
    },
    colors: {
        type: [String]
    },
    sizes: {
        type: [String]
    },
    inStock: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
