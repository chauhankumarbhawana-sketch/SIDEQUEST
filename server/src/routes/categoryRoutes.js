
const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// GET all categories
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories ORDER BY id ASC'
        );

        res.json({
            success: true,
            categories: result.rows
        });

    } catch (error) {
        console.error('Error fetching categories:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

module.exports = router;
