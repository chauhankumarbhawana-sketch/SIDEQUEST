
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

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/experiences', experienceRoutes)
app.use('/api/favourites', favouriteRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/business', businessRoutes)

app.get('/', (req, res) => {
  res.send('SIDEQUEST API is running!')
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SIDEQUEST backend is healthy!',
  })
})

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

const server = app.listen(PORT, () => {
  console.log(`SIDEQUEST server running on port ${PORT}`)
})

// Diagnostic test: process should stay alive
setInterval(() => {
  console.log('SIDEQUEST server is still alive')
}, 5000)
