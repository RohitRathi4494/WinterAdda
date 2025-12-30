const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'winter_adda_products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// Middleware to check if user is Admin
const adminMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// GET /api/products - List all products (with optional query filters)
router.get('/', async (req, res) => {
    try {
        const { category, isFeatured } = req.query;
        let query = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        if (isFeatured === 'true') {
            query.isFeatured = true;
        }
        const products = await Product.find(query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// POST /api/products - Add a new product (Admin only)
// Now supports multipart/form-data
router.post('/', adminMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, category, isFeatured } = req.body;
        let image = req.body.image; // Fallback to URL if string provided

        if (req.file) {
            // Cloudinary storage provides the full URL in path
            image = req.file.path;
        }

        const newProduct = new Product({
            name,
            price,
            description,
            category,
            image,
            isFeatured: isFeatured === 'true' || isFeatured === true
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error creating product', error: error.message });
    }
});

// DELETE /api/products/:id - Delete a product (Admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
});

module.exports = router;
