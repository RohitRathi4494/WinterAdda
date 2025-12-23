const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
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
        // Ensure image URLs are full paths if stored locally
        const productsWithFullPath = products.map(p => {
            let pObj = p.toObject();
            if (pObj.image && !pObj.image.startsWith('http')) {
                // Assuming server is running on same host, but frontend might differ. 
                // Ideally, store relative path and let frontend prepend API_URL base, 
                // or ensure server returns absolute URL. 
                // For simplicty here, we return the relative path stored in DB (e.g. uploads/123.jpg)
                // and Frontend should handle prepending server URL if needed.
                // Actually, let's prepend the current default server URL for ease, or leave as relative.
                // Let's leave as relative "uploads/filename.jpg" and let frontend handle it.
            }
            return pObj;
        });
        res.json(productsWithFullPath);
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
            // If file uploaded, use the file path
            // Windows path might use backslashes, normalize to forward slashes for URL
            image = req.file.path.replace(/\\/g, '/');
            // We want path relative to root? req.file.path gives "uploads\filename.jpg"
            // If server serves /uploads, we want "uploads/filename.jpg" or "https://url/uploads/filename.jpg"
            // Let's store "uploads/filename.jpg"
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
