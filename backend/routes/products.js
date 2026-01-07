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
    upload.array('images', 4)(req, res, (err) => { // Modified for multiple files
        if (err) {
            console.error('Upload Error:', err);
            if (err.message === 'An unknown file format not allowed') {
                return res.status(400).json({ message: 'Invalid file format. Allowed: jpg, png, jpeg, webp' });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Max size is 10MB.' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ message: 'Too many files. Max 4 images allowed.' });
            }
            return res.status(400).json({ message: 'Error uploading image', error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { name, price, description, category, isFeatured, colors, sizes } = req.body;

        // Handle Images
        let image = req.body.image; // Fallback string
        let images = [];

        if (req.files && req.files.length > 0) {
            // New uploads present
            req.files.forEach(file => {
                images.push(file.path);
            });
            image = images[0]; // Set primary image to first uploaded
        } else if (typeof req.body.images === 'string') {
            // Handle case where images might be passed as JSON string (unlikely for file upload, but good safety)
            try {
                images = JSON.parse(req.body.images);
            } catch (e) { images = [req.body.images]; }
        }

        if (!image && images.length > 0) image = images[0];


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
            images,
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

// PUT /api/products/:id - Update a product (Admin only)
router.put('/:id', adminMiddleware, (req, res, next) => {
    upload.array('images', 4)(req, res, (err) => {
        if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({ message: 'Error uploading images', error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { name, price, description, category, isFeatured, colors, sizes } = req.body;

        let updateData = {
            name,
            price,
            description,
            category,
            isFeatured: isFeatured === 'true' || isFeatured === true
        };

        // Parse Arrays
        try { if (colors) updateData.colors = typeof colors === 'string' ? JSON.parse(colors) : colors; } catch (e) { }
        try { if (sizes) updateData.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes; } catch (e) { }

        // Handle Image Updates
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => f.path);
            updateData.images = newImages; // Replace with new images
            updateData.image = newImages[0]; // Update primary
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true } // Return updated document
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(updatedProduct);

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error: error.message });
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
