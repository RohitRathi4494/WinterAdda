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
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('WARNING: Cloudinary credentials missing in environment variables');
}

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
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// POST /api/products - Add a new product (Admin only)
// Now supports multipart/form-data
router.post('/', adminMiddleware, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload Error:', err);
            if (err.message === 'An unknown file format not allowed') {
                return res.status(400).json({ message: 'Invalid file format. Allowed: jpg, png, jpeg, webp' });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Max size is 10MB.' }); // Multer default/Cloudinary limit
            }
            return res.status(400).json({ message: 'Error uploading image', error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { name, price, description, category, isFeatured, colors, sizes } = req.body;
        let image = req.body.image; // Fallback to URL if string provided

        if (req.file) {
            // Cloudinary storage provides the full URL in path
            image = req.file.path;
        }

        // Parse colors and sizes (handle potential string inputs from FormData)
        let parsedColors = [];
        let parsedSizes = [];

        try {
            if (colors) parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
        } catch (e) {
            // If JSON parse fails, assume comma-separated string
            if (typeof colors === 'string') parsedColors = colors.split(',').map(c => c.trim());
        }

        try {
            if (sizes) parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
        } catch (e) {
            if (typeof sizes === 'string') parsedSizes = sizes.split(',').map(s => s.trim());
        }

        const newProduct = new Product({
            name,
            price,
            description,
            category,
            image,
            colors: parsedColors,
            sizes: parsedSizes,
            isFeatured: isFeatured === 'true' || isFeatured === true
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({ message: 'Error creating product', error: error.message });
    }
});

// GET /api/products/:id - Get a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
});

// DELETE /api/products/:id - Delete a product (Admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});

module.exports = router;
