
-- =====================================
-- SIDEQUEST DATABASE SCHEMA
-- =====================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(20) DEFAULT 'user'
        CHECK (role IN ('user', 'business', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    area VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Delhi',
    contact_email VARCHAR(150),
    contact_phone VARCHAR(15),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 4. EXPERIENCES TABLE
CREATE TABLE IF NOT EXISTS experiences (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL
        REFERENCES businesses(id) ON DELETE CASCADE,
    category_id INTEGER
        REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
    location TEXT NOT NULL,
    image_url TEXT,
    opening_time TIME,
    closing_time TIME,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    experience_id INTEGER NOT NULL
        REFERENCES experiences(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, experience_id)
);

-- 6. FAVOURITES TABLE
CREATE TABLE IF NOT EXISTS favourites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    experience_id INTEGER NOT NULL
        REFERENCES experiences(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, experience_id)
);

-- 7. OFFERS TABLE
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL
        REFERENCES businesses(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2)
        CHECK (discount_percentage BETWEEN 0 AND 100),
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- DEFAULT CATEGORIES
-- =====================================

INSERT INTO categories (name, description)
VALUES
    ('Cafes', 'Discover interesting cafes'),
    ('Food', 'Restaurants and food experiences'),
    ('Workshops', 'Creative and learning workshops'),
    ('Hidden Gems', 'Discover lesser-known places'),
    ('Activities', 'Fun activities and experiences'),
    ('Events', 'Events and social experiences')
ON CONFLICT (name) DO NOTHING;

-- =====================================
-- INDEXES FOR BETTER PERFORMANCE
-- =====================================

CREATE INDEX IF NOT EXISTS idx_experiences_business
ON experiences(business_id);

CREATE INDEX IF NOT EXISTS idx_experiences_category
ON experiences(category_id);

CREATE INDEX IF NOT EXISTS idx_reviews_experience
ON reviews(experience_id);

CREATE INDEX IF NOT EXISTS idx_favourites_user
ON favourites(user_id);

CREATE INDEX IF NOT EXISTS idx_businesses_status
ON businesses(status);
