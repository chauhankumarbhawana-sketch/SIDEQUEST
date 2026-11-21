
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const pool = require('./config/db')

const categoryRoutes = require('./routes/categoryRoutes')
const experienceRoutes = require('./routes/experienceRoutes')
const authRoutes = require('./routes/authRoutes')
const favouriteRoutes = require('./routes/favouriteRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const businessRoutes = require('./routes/businessRoutes')

const app = express()

app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/experiences', experienceRoutes)
app.use('/api/favourites', favouriteRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/business', businessRoutes)

// Home Route
app.get('/', (req, res) => {
  res.send('SIDEQUEST API is running!')
})

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SIDEQUEST backend is healthy!',
  })
})

// Database Connection Test
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')

    res.json({
      success: true,
      message: 'SIDEQUEST database connected successfully!',
      databaseTime: result.rows[0].now,
    })
  } catch (error) {
    console.error('Database connection error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Database connection failed!',
    })
  }
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`SIDEQUEST server running on port ${PORT}`)
})
