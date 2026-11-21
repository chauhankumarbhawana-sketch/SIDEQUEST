
const express = require('express')
const router = express.Router()

const pool = require('../config/db')
const authMiddleware = require('../middleware/authMiddleware')

// GET: View logged-in user's favourites
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT experience_id, created_at
       FROM favourites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({
      success: true,
      favourites: result.rows,
    })
  } catch (error) {
    console.error('Get favourites error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to fetch favourites.',
    })
  }
})

// POST: Add a favourite
router.post('/:experienceId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const experienceId = Number(req.params.experienceId)

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience ID.',
      })
    }

    const experience = await pool.query(
      'SELECT id FROM experiences WHERE id = $1',
      [experienceId]
    )

    if (experience.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found.',
      })
    }

    await pool.query(
      `INSERT INTO favourites (user_id, experience_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, experience_id) DO NOTHING`,
      [userId, experienceId]
    )

    res.status(201).json({
      success: true,
      message: 'Added to favourites!',
    })
  } catch (error) {
    console.error('Add favourite error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to add favourite.',
    })
  }
})

// DELETE: Remove a favourite
router.delete('/:experienceId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const experienceId = Number(req.params.experienceId)

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience ID.',
      })
    }

    const result = await pool.query(
      `DELETE FROM favourites
       WHERE user_id = $1 AND experience_id = $2
       RETURNING id`,
      [userId, experienceId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favourite not found.',
      })
    }

    res.json({
      success: true,
      message: 'Removed from favourites.',
    })
  } catch (error) {
    console.error('Remove favourite error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to remove favourite.',
    })
  }
})

module.exports = router
