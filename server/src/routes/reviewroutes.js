
const express = require('express')
const router = express.Router()

const pool = require('../config/db')
const authMiddleware = require('../middleware/authMiddleware')

// GET: Fetch reviews for an experience
router.get('/:experienceId', async (req, res) => {
  try {
    const experienceId = Number(req.params.experienceId)

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience ID.',
      })
    }

    const result = await pool.query(
      `SELECT
        reviews.id,
        reviews.user_id,
        reviews.rating,
        reviews.comment,
        reviews.created_at,
        users.name AS user_name
       FROM reviews
       JOIN users ON reviews.user_id = users.id
       WHERE reviews.experience_id = $1
       ORDER BY reviews.created_at DESC`,
      [experienceId]
    )

    res.json({
      success: true,
      reviews: result.rows,
    })
  } catch (error) {
    console.error('Fetch reviews error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to fetch reviews.',
    })
  }
})

// POST: Add a review
router.post('/:experienceId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const experienceId = Number(req.params.experienceId)
    const rating = Number(req.body.rating)
    const comment = req.body.comment?.trim() || null

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience ID.',
      })
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5.',
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

    const result = await pool.query(
      `INSERT INTO reviews (user_id, experience_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, experience_id) DO NOTHING
       RETURNING *`,
      [userId, experienceId, rating, comment]
    )

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this experience.',
      })
    }

    res.status(201).json({
      success: true,
      message: 'Review added successfully!',
      review: result.rows[0],
    })
  } catch (error) {
    console.error('Add review error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to add review.',
    })
  }
})

// DELETE: Delete your own review
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const reviewId = Number(req.params.reviewId)

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID.',
      })
    }

    const result = await pool.query(
      `DELETE FROM reviews
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [reviewId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you cannot delete it.',
      })
    }

    res.json({
      success: true,
      message: 'Review deleted successfully!',
    })
  } catch (error) {
    console.error('Delete review error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to delete review.',
    })
  }
})

module.exports = router
