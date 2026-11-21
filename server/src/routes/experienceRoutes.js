
const express = require('express');
const router = express.Router();

const pool = require('../config/db');

// GET all approved experiences
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                e.id,
                e.title,
                e.description,
                e.price,
                e.location,
                e.image_url,
                c.name AS category,
                b.name AS business_name,
                b.area,
                b.city
            FROM experiences e
            JOIN businesses b
                ON e.business_id = b.id
            LEFT JOIN categories c
                ON e.category_id = c.id
            WHERE
                e.status = 'approved'
                AND b.status = 'approved'
            ORDER BY e.created_at DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            experiences: result.rows
        });

    } catch (error) {
        console.error('Error fetching experiences:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch experiences'
        });
    }
});

module.exports = router;
