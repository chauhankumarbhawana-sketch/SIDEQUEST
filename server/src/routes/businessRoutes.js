
const express = require('express')
const router = express.Router()

const pool = require('../config/db')
const authMiddleware = require('../middleware/authMiddleware')

// Only business accounts can access these routes
const businessOnly = (req, res, next) => {
  if (req.user.role !== 'business') {
    return res.status(403).json({
      success: false,
      message: 'Only business accounts can access this feature.',
    })
  }

  next()
}

// Only admin accounts can access these routes
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admin accounts can access this feature.',
    })
  }

  next()
}

// Get the logged-in owner's business
const getMyBusiness = async (ownerId) => {
  const result = await pool.query(
    'SELECT * FROM businesses WHERE owner_id = $1 LIMIT 1',
    [ownerId]
  )

  return result.rows[0] || null
}

// ==========================================
// ADMIN ROUTES
// ==========================================

// GET: View all pending businesses
router.get('/admin/businesses', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.*,
         u.name AS owner_name,
         u.email AS owner_email
       FROM businesses b
       LEFT JOIN users u ON b.owner_id = u.id
       WHERE b.status = 'pending'
       ORDER BY b.created_at DESC`
    )

    res.json({
      success: true,
      businesses: result.rows,
    })
  } catch (error) {
    console.error('Fetch pending businesses error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to fetch pending businesses.',
    })
  }
})

// PATCH: Approve or reject a business
router.patch('/admin/businesses/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const businessId = Number(req.params.id)
    const { status } = req.body

    if (!Number.isInteger(businessId) || businessId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business ID.',
      })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected.',
      })
    }

    const result = await pool.query(
      `UPDATE businesses
       SET status = $1
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [status, businessId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending business not found.',
      })
    }

    res.json({
      success: true,
      message: `Business ${status} successfully.`,
      business: result.rows[0],
    })
  } catch (error) {
    console.error('Update business status error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to update business status.',
    })
  }
})

// GET: View all pending experiences
router.get('/admin/experiences', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         e.*,
         c.name AS category,
         b.name AS business_name,
         b.address AS business_address
       FROM experiences e
       JOIN businesses b ON e.business_id = b.id
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.status = 'pending'
       ORDER BY e.created_at DESC`
    )

    res.json({
      success: true,
      experiences: result.rows,
    })
  } catch (error) {
    console.error('Fetch pending experiences error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to fetch pending experiences.',
    })
  }
})

// PATCH: Approve or reject an experience
router.patch('/admin/experiences/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const experienceId = Number(req.params.id)
    const { status } = req.body

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience ID.',
      })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected.',
      })
    }

    const result = await pool.query(
      `UPDATE experiences
       SET status = $1
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [status, experienceId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending experience not found.',
      })
    }

    res.json({
      success: true,
      message: `Experience ${status} successfully.`,
      experience: result.rows[0],
    })
  } catch (error) {
    console.error('Update experience status error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to update experience status.',
    })
  }
})

// ==========================================
// BUSINESS ROUTES
// ==========================================

// GET: View my business profile
router.get('/my', authMiddleware, businessOnly, async (req, res) => {
  try {
    const business = await getMyBusiness(req.user.id)

    res.json({
      success: true,
      business,
    })
  } catch (error) {
    console.error('Fetch business profile error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to fetch business profile.',
    })
  }
})

// POST: Create my business profile
router.post('/', authMiddleware, businessOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      area,
      city,
      contact_email,
      contact_phone,
    } = req.body

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Business name and address are required.',
      })
    }

    const existing = await getMyBusiness(req.user.id)

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have a business profile.',
      })
    }

    const result = await pool.query(
      `INSERT INTO businesses
       (owner_id, name, description, address, area, city,
        contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        name.trim(),
        description?.trim() || null,
        address.trim(),
        area?.trim() || null,
        city?.trim() || null,
        contact_email?.trim() || null,
        contact_phone?.trim() || null,
      ]
    )

    res.status(201).json({
      success: true,
      message: 'Business profile created! Awaiting admin approval.',
      business: result.rows[0],
    })
  } catch (error) {
    console.error('Create business profile error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to create business profile.',
    })
  }
})

// GET: View my experiences
router.get('/my/experiences', authMiddleware, businessOnly, async (req, res) => {
  try {
    const business = await getMyBusiness(req.user.id)

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Please create your business profile first.',
      })
    }

    const result = await pool.query(
      `SELECT
         e.*,
         c.name AS category
       FROM experiences e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.business_id = $1
       ORDER BY e.created_at DESC`,
      [business.id]
    )

    res.json({
      success: true,
      experiences: result.rows,
    })
  } catch (error) {
    console.error('Fetch business experiences error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to fetch your experiences.',
    })
  }
})

// POST: Add a new experience
router.post('/experiences', authMiddleware, businessOnly, async (req, res) => {
  try {
    const business = await getMyBusiness(req.user.id)

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Please create your business profile first.',
      })
    }

    const {
      title,
      description,
      category_id,
      price,
      location,
      image_url,
      opening_time,
      closing_time,
    } = req.body

    if (!title?.trim() || !location?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Experience title and location are required.',
      })
    }

    const experiencePrice =
      price === '' || price === undefined || price === null
        ? 0
        : Number(price)

    if (!Number.isFinite(experiencePrice) || experiencePrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid non-negative price.',
      })
    }

    const result = await pool.query(
      `INSERT INTO experiences
       (business_id, category_id, title, description, price,
        location, image_url, opening_time, closing_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        business.id,
        category_id || null,
        title.trim(),
        description?.trim() || null,
        experiencePrice,
        location.trim(),
        image_url?.trim() || null,
        opening_time || null,
        closing_time || null,
      ]
    )

    res.status(201).json({
      success: true,
      message: 'Experience submitted! Awaiting admin approval.',
      experience: result.rows[0],
    })
  } catch (error) {
    console.error('Create experience error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to create experience.',
    })
  }
})

module.exports = router
