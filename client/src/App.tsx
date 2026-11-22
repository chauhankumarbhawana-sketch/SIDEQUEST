
import { Routes, Route, useParams, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import BusinessDashboard from './pages/BusinessDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

type Experience = {
  id: number
  title: string
  description: string
  price: string | number
  location: string
  image_url: string | null
  category: string
  business_name: string
  area: string
  city: string
}

type User = {
  id?: number
  name: string
  email?: string
  role?: string
}

type Review = {
  id: number
  user_id: number
  rating: number
  comment: string | null
  created_at: string
  user_name: string
}

const categories = [
  'All',
  'Cafes',
  'Food',
  'Workshops',
  'Hidden Gems',
  'Activities',
  'Events',
]

const fallbackImages: Record<string, string> = {
  Cafes: 'photo-1442512595331-e89e73853f31',
  Food: 'photo-1517248135467-4c7edcad34c4',
  Workshops: 'photo-1565193566173-7a0ee3dbe261',
  'Hidden Gems': 'photo-1507842217343-583bb7270b66',
  Activities: 'photo-1470225620780-dba8ba36b745',
  Events: 'photo-1492684223066-81342ee5ff30',
}

function getExperienceImage(experience: Experience, width = 900) {
  if (experience.image_url) return experience.image_url

  const imageId =
    fallbackImages[experience.category] || fallbackImages.Cafes

  return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=${width}&q=85`
}

function getSavedUser(): User | null {
  const savedUser = localStorage.getItem('sidequest_user')

  if (!savedUser) return null

  try {
    return JSON.parse(savedUser) as User
  } catch {
    return null
  }
}

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(getSavedUser)
  const [favouriteIds, setFavouriteIds] = useState<number[]>([])
  const [favouriteError, setFavouriteError] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('sidequest_token')
    localStorage.removeItem('sidequest_user')
    setCurrentUser(null)
    setFavouriteIds([])
    setFavouriteError('')
  }

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/experiences`)

        if (!response.ok) throw new Error('Unable to fetch experiences')

        const data = await response.json()
        setExperiences(data.experiences || [])
      } catch (err) {
        console.error('API Error:', err)
        setError('Unable to load experiences. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchExperiences()
  }, [])

  useEffect(() => {
    const fetchFavourites = async () => {
      const token = localStorage.getItem('sidequest_token')

      if (!token) {
        setFavouriteIds([])
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/favourites`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'Unable to load favourites')

        setFavouriteIds(
          (data.favourites || []).map(
            (item: { experience_id: number }) => Number(item.experience_id),
          ),
        )
      } catch (error) {
        console.error('Favourites error:', error)
      }
    }

    fetchFavourites()
  }, [currentUser])

  const handleFavourite = async (experienceId: number) => {
    const token = localStorage.getItem('sidequest_token')

    if (!token) {
      alert('Please login to save your favourites!')
      return
    }

    const isFavourite = favouriteIds.includes(experienceId)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/favourites/${experienceId}`,
        {
          method: isFavourite ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to update favourite')

      setFavouriteIds((previous) =>
        isFavourite
          ? previous.filter((id) => id !== experienceId)
          : [...previous, experienceId],
      )

      setFavouriteError('')
    } catch (error) {
      console.error('Favourite update error:', error)
      setFavouriteError(
        error instanceof Error ? error.message : 'Something went wrong',
      )
    }
  }

  const filteredExperiences = useMemo(() => {
    return experiences.filter((place) => {
      const matchesCategory =
        activeCategory === 'All' || place.category === activeCategory

      const searchableText =
        `${place.title} ${place.category} ${place.location} ${place.business_name} ${place.area}`.toLowerCase()

      return matchesCategory && searchableText.includes(search.toLowerCase())
    })
  }, [experiences, activeCategory, search])

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F8F8F2] text-[#20211E]">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-5 py-5 md:px-10 lg:px-16">
        <Link to="/" className="shrink-0 text-2xl font-black tracking-tighter">
          SIDEQUEST<span className="text-[#B5E550]">.</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium md:flex lg:gap-9">
          <a href="/#explore" className="transition hover:text-lime-700">Explore</a>
          <a href="/#experiences" className="transition hover:text-lime-700">Experiences</a>
          <a href="/#about" className="transition hover:text-lime-700">About us</a>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <span className="text-sm font-semibold">Hi, {currentUser.name}!</span>

              {currentUser.role === 'admin' ? (
                <Link
                  to="/admin-dashboard"
                  className="whitespace-nowrap rounded-full bg-[#EAF2D7] px-4 py-3 text-sm font-semibold transition hover:bg-[#B5E550]"
                >
                  Ã°Å¸â€ºÂ¡Ã¯Â¸Â Admin Dashboard
                </Link>
              ) : currentUser.role === 'business' ? (
                <Link
                  to="/business-dashboard"
                  className="whitespace-nowrap rounded-full bg-[#EAF2D7] px-4 py-3 text-sm font-semibold transition hover:bg-[#B5E550]"
                >
                  Ã°Å¸ÂÂª Dashboard
                </Link>
              ) : (
                <Link
                  to="/favourites"
                  className="whitespace-nowrap rounded-full border border-black/15 px-4 py-3 text-sm font-semibold transition hover:bg-[#EAF2D7]"
                >
                  Ã¢â„¢Â¥ Favourites
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="whitespace-nowrap rounded-full bg-[#20211E] px-5 py-3 text-sm text-white transition hover:bg-red-600"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold hover:text-lime-700">Log In</Link>
              <Link to="/signup" className="whitespace-nowrap rounded-full bg-[#20211E] px-5 py-3 text-sm text-white transition hover:bg-lime-700">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main>
        <section className="px-6 pb-16 pt-20 md:px-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-lime-500" />
              Your city, your next adventure
            </div>

            <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl md:text-8xl">
              Life is too short<br />
              for <span className="text-[#91BD36]">boring</span><br />
              weekends.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-[#66675F] md:text-lg">
              Discover cool places, unexpected experiences and little adventures waiting around your city.
            </p>

            <a href="#explore" className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#20211E] px-7 py-4 font-semibold text-white transition hover:bg-lime-700">
              Find your next SIDEQUEST <span>Ã¢â€ â€”</span>
            </a>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-6">
            <div className="rounded-2xl bg-[#E9EBD9] p-5 md:p-7">
              <span className="text-3xl md:text-4xl">Ã¢Ëœâ€¢</span>
              <p className="mt-4 text-base font-bold md:text-lg">New places</p>
              <p className="mt-1 text-sm text-gray-600">Find your next favourite.</p>
            </div>
            <div className="rounded-2xl bg-[#E8E8DE] p-5 md:p-7">
              <span className="text-3xl md:text-4xl">Ã°Å¸Å½Â¨</span>
              <p className="mt-4 text-base font-bold md:text-lg">New experiences</p>
              <p className="mt-1 text-sm text-gray-600">Try something different.</p>
            </div>
            <div className="rounded-2xl bg-[#E6EDCF] p-5 md:p-7">
              <span className="text-3xl md:text-4xl">Ã°Å¸â€œÂ</span>
              <p className="mt-4 text-base font-bold md:text-lg">Hidden gems</p>
              <p className="mt-1 text-sm text-gray-600">Explore beyond the usual.</p>
            </div>
          </div>
        </section>

        <section id="explore" className="bg-[#EFEFE6] px-6 py-16 md:px-16">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-lime-800">The city is calling</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">What's your vibe?</h2>
            </div>
            <p className="max-w-sm text-sm text-gray-600">Pick a mood, find a place and make the day yours.</p>
          </div>

          <div className="mt-9 flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4">
            <span className="text-xl">Ã¢Å’â€¢</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search places, activities or areas..." className="w-full min-w-0 bg-transparent text-sm outline-none" />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <button key={category} onClick={() => setActiveCategory(category)} className={`rounded-full px-5 py-3 text-sm font-semibold transition ${activeCategory === category ? 'bg-[#20211E] text-white' : 'border border-black/15 hover:bg-[#B5E550]'}`}>
                {category}
              </button>
            ))}
          </div>
        </section>

        <section id="experiences" className="px-6 py-16 md:px-16">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-lime-800">Handpicked for you</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">Explore something new.</h2>
            </div>
            <span className="text-sm text-gray-500">Delhi edition Ã‚Â· 01</span>
          </div>

          {favouriteError && <p className="mb-4 text-sm text-red-600">{favouriteError}</p>}

          {loading ? (
            <div className="py-16 text-center text-gray-500">Discovering experiences for you...</div>
          ) : error ? (
            <div className="py-16 text-center text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExperiences.map((place) => (
                <div key={place.id} className="relative">
                  <Link to={`/experiences/${place.id}`} aria-label={`View details for ${place.title}`} className="block h-full rounded-3xl text-inherit no-underline focus:outline-none focus:ring-2 focus:ring-lime-600">
                    <article className="group h-full cursor-pointer overflow-hidden rounded-3xl border border-black/5 bg-white transition hover:shadow-xl">
                      <div className="h-64 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]" style={{ backgroundImage: `url("${getExperienceImage(place)}")` }} />
                      <div className="p-6">
                        <span className="rounded-full bg-[#EAF2D7] px-3 py-2 text-xs font-semibold">{place.category}</span>
                        <h3 className="mt-5 text-xl font-bold">{place.title}</h3>
                        <p className="mt-2 text-sm text-gray-500">{place.business_name}</p>
                        <p className="mt-2 text-sm text-gray-500">Ã°Å¸â€œÂ {place.location}</p>
                        <p className="mt-3 text-sm text-gray-600">{place.description}</p>
                        <div className="mt-5 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">Ã¢â€šÂ¹{Number(place.price).toLocaleString('en-IN')} onwards</span>
                          <span className="text-xs text-gray-500">{place.area}</span>
                        </div>
                      </div>
                    </article>
                  </Link>

                  <button type="button" onClick={() => handleFavourite(place.id)} aria-label={favouriteIds.includes(place.id) ? 'Remove from favourites' : 'Add to favourites'} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-md transition hover:scale-110">
                    <span className={favouriteIds.includes(place.id) ? 'text-red-500' : 'text-gray-400'}>
                      {favouriteIds.includes(place.id) ? 'Ã¢â„¢Â¥' : 'Ã¢â„¢Â¡'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredExperiences.length === 0 && (
            <div className="py-16 text-center text-gray-500">No matching experiences yet. Try another search!</div>
          )}
        </section>

        <section className="mx-6 mb-16 rounded-[2rem] bg-[#20211E] px-8 py-14 text-white md:mx-16 md:px-16">
          <p className="text-sm uppercase tracking-widest text-[#B5E550]">Coming soon</p>
          <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-6xl">No plans?<br />We'll make you one.</h2>
          <p className="mt-5 max-w-lg text-gray-300">Your budget, your mood, your time. Let SIDEQUEST create an outing worth remembering.</p>
          <button disabled className="mt-8 cursor-not-allowed rounded-full bg-[#B5E550] px-7 py-4 font-bold text-black opacity-90">Quest Generator Ã‚Â· Coming soon</button>
        </section>

        <footer id="about" className="border-t border-black/10 px-6 py-9 md:px-16">
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <div>
              <p className="text-xl font-black tracking-tight">SIDEQUEST<span className="text-lime-600">.</span></p>
              <p className="mt-2 text-sm text-gray-500">Less scrolling. More living.</p>
            </div>
            <p className="text-sm text-gray-500 md:self-end">Made for explorers. Starting in Delhi. Ã‚Â© 2026 SIDEQUEST</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

function ExperienceDetails({ id }: { id: string }) {
  const [experience, setExperience] = useState<Experience | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [currentUser] = useState<User | null>(getSavedUser)

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Unable to fetch reviews')

      setReviews(data.reviews || [])
    } catch (err) {
      console.error('Reviews error:', err)
      setReviewError(err instanceof Error ? err.message : 'Unable to load reviews.')
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/experiences`)

        if (!response.ok) throw new Error('Unable to fetch experiences')

        const data = await response.json()
        const selected = (data.experiences || []).find(
          (item: Experience) => item.id === Number(id),
        )

        if (!selected) setError('Experience not found.')
        else setExperience(selected)
      } catch (err) {
        console.error('Experience details error:', err)
        setError('Unable to load this experience. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchExperience()
    fetchReviews()
  }, [id])

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setReviewError('')
    setReviewMessage('')

    const token = localStorage.getItem('sidequest_token')

    if (!token) {
      setReviewError('Please login to submit a review.')
      return
    }

    setSubmittingReview(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Unable to submit review.')

      setComment('')
      setRating(5)
      setReviewMessage('Your review has been added successfully!')
      await fetchReviews()
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    const token = localStorage.getItem('sidequest_token')
    if (!token) return

    const confirmed = window.confirm('Are you sure you want to delete your review?')
    if (!confirmed) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to delete review.')

      setReviewMessage('Your review has been deleted.')
      setReviewError('')
      await fetchReviews()
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Unable to delete review.')
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F8F2] text-gray-500">Loading experience...</div>
  }

  if (error || !experience) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#F8F8F2] px-6 text-center">
        <p className="text-gray-600">{error || 'Experience not found.'}</p>
        <Link to="/" className="rounded-full bg-[#20211E] px-6 py-3 text-white no-underline">Back to Explore</Link>
      </div>
    )
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${experience.location}, ${experience.area}, ${experience.city}`)}`

  const myReview = reviews.find(
    (review) => currentUser?.id && Number(review.user_id) === Number(currentUser.id),
  )

  return (
    <div className="min-h-screen bg-[#F8F8F2] text-[#20211E]">
      <nav className="flex items-center justify-between gap-4 border-b border-black/10 px-6 py-5 md:px-16">
        <Link to="/" className="text-2xl font-black tracking-tighter no-underline">SIDEQUEST<span className="text-[#B5E550]">.</span></Link>
        <Link to="/#experiences" className="text-sm font-semibold text-inherit no-underline transition hover:text-lime-700">Ã¢â€ Â Back to Explore</Link>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
        <img src={getExperienceImage(experience, 1200)} alt={experience.title} className="h-72 w-full rounded-3xl object-cover md:h-[460px]" />

        <div className="mt-9">
          <span className="rounded-full bg-[#EAF2D7] px-4 py-2 text-xs font-semibold">{experience.category}</span>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">{experience.title}</h1>
          <p className="mt-3 text-lg text-gray-500">{experience.business_name}</p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-6">
              <p className="text-sm text-gray-500">Location</p>
              <p className="mt-2 font-bold">Ã°Å¸â€œÂ {experience.location}, {experience.area}, {experience.city}</p>
            </div>
            <div className="rounded-2xl bg-white p-6">
              <p className="text-sm text-gray-500">Starting price</p>
              <p className="mt-2 text-xl font-bold">Ã¢â€šÂ¹{Number(experience.price).toLocaleString('en-IN')} onwards</p>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-2xl font-black">About this experience</h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-gray-600">{experience.description}</p>
          </section>

          <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-9 inline-flex rounded-full bg-[#20211E] px-7 py-4 font-semibold text-white no-underline transition hover:bg-lime-700">
            Get Directions Ã¢â€ â€”
          </a>

          <section className="mt-16 border-t border-black/10 pt-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-lime-800">Community feedback</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Reviews & Ratings Ã¢Â­Â</h2>

            {reviews.length > 0 && (
              <div className="mt-5 rounded-2xl bg-[#EAF2D7] p-5">
                <p className="text-sm text-gray-600">Average rating</p>
                <p className="mt-1 text-3xl font-black">
                  {(reviews.reduce((total, review) => total + Number(review.rating), 0) / reviews.length).toFixed(1)} / 5
                </p>
                <p className="text-sm text-gray-600">{reviews.length} review(s)</p>
              </div>
            )}

            <div className="mt-8 rounded-3xl bg-white p-6 md:p-8">
              <h3 className="text-xl font-bold">Share your experience</h3>

              {!localStorage.getItem('sidequest_token') ? (
                <p className="mt-4 text-sm text-gray-600">
                  Please <Link to="/login" className="font-bold text-lime-700 underline">log in</Link> to write a review.
                </p>
              ) : myReview ? (
                <p className="mt-4 text-sm text-gray-600">You have already reviewed this experience. You can delete your review below if you want to change it.</p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="mt-5 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold">Your rating</label>
                    <div className="mt-2 flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} aria-label={`Rate ${star} stars`} className={`text-3xl transition hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          Ã¢Ëœâ€¦
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{rating} out of 5 stars</p>
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="block text-sm font-semibold">Your review (optional)</label>
                    <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={4} maxLength={1000} placeholder="Tell others what you liked about this experience..." className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-lime-600" />
                  </div>

                  <button type="submit" disabled={submittingReview} className="rounded-full bg-[#20211E] px-7 py-3 font-semibold text-white transition hover:bg-lime-700 disabled:opacity-50">
                    {submittingReview ? 'Submitting...' : 'Submit Review Ã¢â€ â€™'}
                  </button>
                </form>
              )}

              {reviewMessage && <p className="mt-4 text-sm text-green-700">{reviewMessage}</p>}
              {reviewError && <p className="mt-4 text-sm text-red-600">{reviewError}</p>}
            </div>

            <div className="mt-10">
              <h3 className="text-2xl font-black">What people are saying</h3>

              {reviewsLoading ? (
                <p className="mt-6 text-gray-500">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-white p-8 text-center">
                  <p className="text-4xl">Ã°Å¸â€™Â¬</p>
                  <p className="mt-3 font-bold">No reviews yet</p>
                  <p className="mt-2 text-sm text-gray-500">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-2xl bg-white p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{review.user_name}</p>
                          <p className="mt-1 text-sm text-gray-400">{new Date(review.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <p className="text-xl text-yellow-400">{'Ã¢Ëœâ€¦'.repeat(Number(review.rating))}{'Ã¢Ëœâ€ '.repeat(5 - Number(review.rating))}</p>
                      </div>

                      {review.comment && <p className="mt-4 leading-relaxed text-gray-600">{review.comment}</p>}

                      {currentUser?.id && Number(review.user_id) === Number(currentUser.id) && (
                        <button onClick={() => handleDeleteReview(review.id)} className="mt-4 text-sm font-semibold text-red-600 hover:underline">
                          Delete my review
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function FavouritesPage() {
  const [favourites, setFavourites] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFavourites = async () => {
      const token = localStorage.getItem('sidequest_token')

      if (!token) {
        setError('Please login to view your favourites.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/favourites`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to fetch favourites')

        const favouriteIds = (data.favourites || []).map(
          (item: { experience_id: number }) => Number(item.experience_id),
        )

        const experienceResponse = await fetch(`${API_BASE_URL}/api/experiences`)
        if (!experienceResponse.ok) throw new Error('Unable to fetch experiences')

        const experienceData = await experienceResponse.json()
        const savedExperiences = (experienceData.experiences || []).filter(
          (place: Experience) => favouriteIds.includes(Number(place.id)),
        )

        setFavourites(savedExperiences)
      } catch (err) {
        console.error('Favourites page error:', err)
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    fetchFavourites()
  }, [])

  const removeFavourite = async (experienceId: number) => {
    const token = localStorage.getItem('sidequest_token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/favourites/${experienceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to remove favourite')

      setFavourites((previous) => previous.filter((place) => place.id !== experienceId))
    } catch (err) {
      console.error('Remove favourite error:', err)
      setError(err instanceof Error ? err.message : 'Unable to remove favourite.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F2] text-[#20211E]">
      <nav className="flex items-center justify-between border-b border-black/10 px-6 py-5 md:px-16">
        <Link to="/" className="text-2xl font-black tracking-tighter no-underline">SIDEQUEST<span className="text-[#B5E550]">.</span></Link>
        <Link to="/" className="text-sm font-semibold text-inherit no-underline hover:text-lime-700">Ã¢â€ Â Back to Explore</Link>
      </nav>

      <main className="px-6 py-14 md:px-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-lime-800">Your personal collection</p>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">My Favourites <span className="text-red-500">Ã¢â„¢Â¥</span></h1>
        <p className="mt-3 text-gray-500">All the places you want to explore, in one place.</p>

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading your favourites...</div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">
            {error}
            <div className="mt-5"><Link to="/login" className="font-bold underline">Log in</Link></div>
          </div>
        ) : favourites.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl">Ã¢â„¢Â¡</p>
            <h2 className="mt-5 text-2xl font-bold">No favourites yet!</h2>
            <p className="mt-2 text-gray-500">Save places you love and find them here.</p>
            <Link to="/" className="mt-7 inline-flex rounded-full bg-[#20211E] px-7 py-4 font-semibold text-white no-underline hover:bg-lime-700">Explore places Ã¢â€ â€”</Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {favourites.map((place) => (
              <div key={place.id} className="relative">
                <Link to={`/experiences/${place.id}`} className="block h-full text-inherit no-underline">
                  <article className="h-full overflow-hidden rounded-3xl border border-black/5 bg-white transition hover:shadow-xl">
                    <img src={getExperienceImage(place)} alt={place.title} className="h-64 w-full object-cover" />
                    <div className="p-6">
                      <span className="rounded-full bg-[#EAF2D7] px-3 py-2 text-xs font-semibold">{place.category}</span>
                      <h3 className="mt-5 text-xl font-bold">{place.title}</h3>
                      <p className="mt-2 text-sm text-gray-500">{place.business_name}</p>
                      <p className="mt-2 text-sm text-gray-500">Ã°Å¸â€œÂ {place.location}</p>
                      <p className="mt-4 text-sm font-semibold">Ã¢â€šÂ¹{Number(place.price).toLocaleString('en-IN')} onwards</p>
                    </div>
                  </article>
                </Link>
                <button onClick={() => removeFavourite(place.id)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-red-500 shadow-md transition hover:scale-110" aria-label="Remove from favourites">Ã¢â„¢Â¥</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ExperienceRoute() {
  const { id } = useParams<{ id: string }>()
  return id ? <ExperienceDetails id={id} /> : <HomePage />
}

// Admin route protection
function AdminRoute() {
  const currentUser = getSavedUser()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <AdminDashboard />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/experiences/:id" element={<ExperienceRoute />} />
      <Route path="/favourites" element={<FavouritesPage />} />
      <Route path="/business-dashboard" element={<BusinessDashboard />} />
      <Route path="/admin-dashboard" element={<AdminRoute />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}

export default App
