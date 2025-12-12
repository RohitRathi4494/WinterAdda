const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
    try {
        // 1. Register
        console.log('Testing Registration...');
        const registerRes = await axios.post(`${API_URL}/register`, {
            username: 'testuser_' + Date.now(),
            email: 'test_' + Date.now() + '@example.com',
            password: 'password123'
        });
        console.log('Registration Success:', registerRes.data);

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: registerRes.config.data ? JSON.parse(registerRes.config.data).email : 'test@example.com', // simplified
            password: 'password123'
        });
        console.log('Login Success:', loginRes.data);

        if (loginRes.data.token) {
            console.log('\nToken received. Auth flow verified.');
        } else {
            console.error('\nNo token received.');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

// We need to run this while the server is running.
// For now, I'll just print instructions or try to run it if I can start the server in background.
console.log('Please ensure the server is running on port 5000 before executing this script.');
// testAuth(); 
