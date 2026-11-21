
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// USER / BUSINESS SIGNUP
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, accountType } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters.'
            });
        }

        const role = accountType === 'business' ? 'business' : 'user';

        if (accountType && !['user', 'business'].includes(accountType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid account type.'
            });
        }

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.trim().toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, phone, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, phone, role`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                hashedPassword,
                phone || null,
                role
            ]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user,
            token
        });

    } catch (error) {
        console.error('Registration error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Something went wrong during registration.'
        });
    }
});


// USER LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = result.rows[0];

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Something went wrong during login.'
        });
    }
});

module.exports = router;
