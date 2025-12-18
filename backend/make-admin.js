const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/winter_adda';

const emailToPromote = process.argv[2]; // Get email from command line argument

if (!emailToPromote) {
    console.error('Please provide an email address. Usage: node make-admin.js <email>');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB...');

        const user = await User.findOne({ email: emailToPromote });

        if (!user) {
            console.error(`User with email ${emailToPromote} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Success! User ${user.username} (${user.email}) is now an Admin.`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
