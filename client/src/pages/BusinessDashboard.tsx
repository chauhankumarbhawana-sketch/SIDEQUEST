
import { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const API_URL = `${API_BASE_URL}/api/business`
const CATEGORY_URL = `${API_BASE_URL}/api/categories`

type Business = {
  id: number
  name: string
  description: string | null
  address: string
  area: string | null
  city: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
}

type Category = {
  id: number
  name: string
}

type Experience = {
  id: number
  title: string
  description: string | null
  category: string | null
  category_id?: number | null
  price: string | number
  location: string
  image_url: string | null
  opening_time: string | null
  closing_time: string | null
  status: string
}

const emptyExperienceForm = {
  title: '',
  description: '',
  category_id: '',
  price: '',
  location: '',
  image_url: '',
  opening_time: '',
  closing_time: '',
}

function BusinessDashboard() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [experienceSaving, setExperienceSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [experienceError, setExperienceError] = useState('')
  const [experienceSuccess, setExperienceSuccess] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    area: '',
    city: 'Delhi',
    contact_email: '',
    contact_phone: '',
  })

  const [experienceForm, setExperienceForm] = useState(emptyExperienceForm)

  const token = localStorage.getItem('sidequest_token')

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  }

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [businessResponse, categoryResponse] = await Promise.all([
          fetch(`${API_URL}/my`, { headers: authHeaders }),
          fetch(CATEGORY_URL),
        ])

        const businessData = await businessResponse.json()
        const categoryData = await categoryResponse.json()

        if (!businessResponse.ok) {
          throw new Error(
            businessData.message || 'Unable to load business profile.'
          )
        }

        if (!categoryResponse.ok) {
          throw new Error('Unable to load categories.')
        }

        setCategories(categoryData.categories || [])

        if (businessData.business) {
          setBusiness(businessData.business)

          setForm({
            name: businessData.business.name || '',
            description: businessData.business.description || '',
            address: businessData.business.address || '',
            area: businessData.business.area || '',
            city: businessData.business.city || 'Delhi',
            contact_email: businessData.business.contact_email || '',
            contact_phone: businessData.business.contact_phone || '',
          })

          const experienceResponse = await fetch(
            `${API_URL}/my/experiences`,
            { headers: authHeaders }
          )

          const experienceData = await experienceResponse.json()

          if (!experienceResponse.ok) {
            throw new Error(
              experienceData.message || 'Unable to load experiences.'
            )
          }

          setExperiences(experienceData.experiences || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [token])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleExperienceChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setExperienceForm({
      ...experienceForm,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create business profile.')
      }

      setBusiness(data.business)
      setSuccess(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (experience: Experience) => {
    setEditingId(experience.id)
    setExperienceError('')
    setExperienceSuccess('')

    setExperienceForm({
      title: experience.title || '',
      description: experience.description || '',
      category_id: experience.category_id
        ? String(experience.category_id)
        : '',
      price: String(experience.price ?? ''),
      location: experience.location || '',
      image_url: experience.image_url || '',
      opening_time: experience.opening_time?.slice(0, 5) || '',
      closing_time: experience.closing_time?.slice(0, 5) || '',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setExperienceForm(emptyExperienceForm)
    setExperienceError('')
    setExperienceSuccess('')
  }

  const handleExperienceSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    setExperienceError('')
    setExperienceSuccess('')
    setExperienceSaving(true)

    try {
      const isEditing = editingId !== null

      const response = await fetch(
        isEditing
          ? `${API_URL}/experiences/${editingId}`
          : `${API_URL}/experiences`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            ...experienceForm,
            category_id: experienceForm.category_id || null,
            price: experienceForm.price || 0,
            opening_time: experienceForm.opening_time || null,
            closing_time: experienceForm.closing_time || null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || (isEditing
            ? 'Unable to update experience.'
            : 'Unable to add experience.')
        )
      }

      if (isEditing) {
        setExperiences((previous) =>
          previous.map((item) =>
            item.id === editingId
              ? { ...data.experience, status: data.experience.status || 'pending' }
              : item
          )
        )
        setExperienceSuccess(data.message || 'Experience updated successfully.')
        setEditingId(null)
      } else {
        setExperiences((previous) => [
          data.experience,
          ...previous,
        ])
        setExperienceSuccess(data.message || 'Experience submitted successfully.')
      }

      setExperienceForm(emptyExperienceForm)
    } catch (err) {
      setExperienceError(
        err instanceof Error ? err.message : 'Something went wrong.'
      )
    } finally {
      setExperienceSaving(false)
    }
  }

  const handleDelete = async (experienceId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this experience? This action cannot be undone.'
    )

    if (!confirmed) return

    setDeletingId(experienceId)
    setExperienceError('')
    setExperienceSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/experiences/${experienceId}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete experience.')
      }

      setExperiences((previous) =>
        previous.filter((item) => item.id !== experienceId)
      )

      if (editingId === experienceId) {
        cancelEditing()
      }

      setExperienceSuccess(data.message || 'Experience deleted successfully.')
    } catch (err) {
      setExperienceError(
        err instanceof Error ? err.message : 'Something went wrong.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f2] flex items-center justify-center">
        <p className="text-gray-500 font-medium">
          Loading your dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f2] px-5 py-12">
      <div className="max-w-4xl mx-auto">

        <p className="text-sm font-bold uppercase tracking-widest text-lime-700">
          SIDEQUEST Business
        </p>

        <h1 className="text-4xl font-black text-[#20211e] mt-3">
          Business Dashboard
        </h1>

        <p className="text-gray-500 mt-3">
          Manage your business presence and reach more explorers.
        </p>

        {business ? (
          <>
            <div className="bg-white rounded-3xl p-8 mt-10 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Your business</p>
                  <h2 className="text-2xl font-black mt-1">
                    {business.name}
                  </h2>
                </div>

                <span className={`w-fit px-4 py-2 rounded-full text-sm font-bold ${
                  business.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : business.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {business.status === 'approved'
                    ? 'Approved'
                    : business.status === 'rejected'
                      ? 'Rejected'
                      : 'Pending Approval'}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Address
                  </p>
                  <p className="mt-2 font-medium">{business.address}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Area / City
                  </p>
                  <p className="mt-2 font-medium">
                    {[business.area, business.city].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Contact Email
                  </p>
                  <p className="mt-2 font-medium">
                    {business.contact_email || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Contact Phone
                  </p>
                  <p className="mt-2 font-medium">
                    {business.contact_phone || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="mt-8 p-5 rounded-2xl bg-[#f8f8f2]">
                <p className="font-bold">Business description</p>
                <p className="text-gray-600 mt-2">
                  {business.description || 'No description added yet.'}
                </p>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                {business.status === 'approved'
                  ? 'Your business profile is approved.'
                  : 'Your business profile is awaiting admin approval. Your listings will also need approval before appearing publicly.'}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 mt-8 border border-gray-100 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-widest text-lime-700">
                Grow your presence
              </p>

              <h2 className="text-2xl font-black mt-2">
                {editingId ? 'Edit Experience' : 'Add a New Experience'}
              </h2>

              <p className="text-gray-500 text-sm mt-2">
                {editingId
                  ? 'Update your experience details below.'
                  : 'Add a cafe experience, workshop, activity or something special.'}
              </p>

              <form onSubmit={handleExperienceSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Experience Title *
                  </label>
                  <input
                    name="title"
                    value={experienceForm.title}
                    onChange={handleExperienceChange}
                    required
                    maxLength={150}
                    placeholder="e.g. Coffee & Chill"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={experienceForm.description}
                    onChange={handleExperienceChange}
                    rows={4}
                    placeholder="Describe what visitors can experience..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Category
                  </label>
                  <select
                    name="category_id"
                    value={experienceForm.category_id}
                    onChange={handleExperienceChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600 bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={experienceForm.price}
                      onChange={handleExperienceChange}
                      min="0"
                      step="0.01"
                      placeholder="e.g. 300"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Location *
                    </label>
                    <input
                      name="location"
                      value={experienceForm.location}
                      onChange={handleExperienceChange}
                      required
                      placeholder="e.g. Hauz Khas, Delhi"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={experienceForm.image_url}
                    onChange={handleExperienceChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      name="opening_time"
                      value={experienceForm.opening_time}
                      onChange={handleExperienceChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      name="closing_time"
                      value={experienceForm.closing_time}
                      onChange={handleExperienceChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                    />
                  </div>
                </div>

                {experienceError && (
                  <p className="text-red-600 text-sm">{experienceError}</p>
                )}

                {experienceSuccess && (
                  <p className="text-green-700 text-sm">
                    {experienceSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={experienceSaving}
                  className="w-full bg-[#20211e] text-white rounded-xl py-4 font-bold hover:bg-lime-700 transition disabled:opacity-50"
                >
                  {experienceSaving
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes →'
                      : 'Submit Experience →'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="w-full border border-gray-300 rounded-xl py-3 font-bold hover:bg-gray-50"
                  >
                    Cancel Editing
                  </button>
                )}

                <p className="text-xs text-gray-400 text-center">
                  {editingId
                    ? 'Your updated experience may need admin approval again.'
                    : 'Your experience will remain pending until admin approval.'}
                </p>
              </form>
            </div>

            <div className="mt-10">
              <h2 className="text-2xl font-black text-[#20211e]">
                My Experiences
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                All experiences submitted by your business.
              </p>

              {experiences.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 mt-5 text-center border border-gray-100">
                  <p className="text-gray-500">
                    You haven't added any experiences yet.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5 mt-5">
                  {experiences.map((experience) => (
                    <div
                      key={experience.id}
                      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-bold text-lg">
                          {experience.title}
                        </h3>

                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                          experience.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : experience.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {experience.status === 'approved'
                            ? 'Approved'
                            : experience.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-2">
                        {experience.category || 'Uncategorized'}
                      </p>

                      <p className="font-bold mt-3">
                        ₹{Number(experience.price).toLocaleString('en-IN')}
                      </p>

                      <p className="text-sm text-gray-500 mt-2">
                        📍 {experience.location}
                      </p>

                      {experience.description && (
                        <p className="text-sm text-gray-600 mt-3">
                          {experience.description}
                        </p>
                      )}

                      <div className="flex gap-3 mt-5">
                        <button
                          type="button"
                          onClick={() => startEditing(experience)}
                          className="flex-1 bg-[#20211e] text-white rounded-xl py-3 text-sm font-bold hover:bg-lime-700 transition"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(experience.id)}
                          disabled={deletingId === experience.id}
                          className="flex-1 border border-red-200 text-red-600 rounded-xl py-3 text-sm font-bold hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {deletingId === experience.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl p-8 mt-10 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black">
              Create your business profile
            </h2>

            <p className="text-gray-500 mt-2 text-sm">
              Tell us about your business. Your profile will be reviewed before it goes live.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Business Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. The Cozy Corner Cafe"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us what makes your business special..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Full Address *
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter your business address"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Area
                  </label>
                  <input
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="e.g. Hauz Khas"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    City
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={form.contact_email}
                    onChange={handleChange}
                    placeholder="business@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={form.contact_phone}
                    onChange={handleChange}
                    placeholder="Contact number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-700 text-sm">{success}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#20211e] text-white rounded-xl py-4 font-bold hover:bg-lime-700 transition disabled:opacity-50"
              >
                {saving ? 'Creating profile...' : 'Submit Business Profile →'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Your profile will remain pending until an admin reviews it.
              </p>
            </form>
          </div>
        )}

        {error && business && (
          <p className="text-red-600 text-sm mt-5">{error}</p>
        )}

        <a
          href="/"
          className="inline-block mt-8 text-sm font-bold text-lime-700 hover:underline"
        >
          ← Back to SIDEQUEST
        </a>
      </div>
    </div>
  )
}

export default BusinessDashboard
