
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000/api/business'

type Business = {
  id: number
  name: string
  description: string | null
  address: string
  area: string | null
  city: string | null
  contact_email: string | null
  contact_phone?: string | null
  owner_name: string
  owner_email: string
  status: string
}

type Experience = {
  id: number
  title: string
  description: string | null
  price: string | number
  location: string
  category: string | null
  business_name: string
  business_address: string
  status: string
}

export default function AdminDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('sidequest_token')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [businessResponse, experienceResponse] = await Promise.all([
        fetch(`${API_URL}/admin/businesses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/experiences`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const businessData = await businessResponse.json()
      const experienceData = await experienceResponse.json()

      if (!businessResponse.ok) {
        throw new Error(businessData.message || 'Unable to load businesses.')
      }

      if (!experienceResponse.ok) {
        throw new Error(experienceData.message || 'Unable to load experiences.')
      }

      setBusinesses(businessData.businesses || [])
      setExperiences(experienceData.experiences || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updateStatus = async (
    type: 'businesses' | 'experiences',
    id: number,
    status: 'approved' | 'rejected',
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/${type}/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update status.')
      }

      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f2] p-10 text-center">
        Loading admin dashboard...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f8f2] px-6 py-10 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">
              SIDEQUEST ADMIN
            </p>
            <h1 className="text-4xl font-bold text-[#20211e]">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage business registrations and experience approvals.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="rounded-full bg-[#20211e] px-6 py-3 font-semibold text-white hover:bg-lime-700"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">Pending Businesses</p>
            <h2 className="mt-2 text-4xl font-bold">{businesses.length}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">Pending Experiences</p>
            <h2 className="mt-2 text-4xl font-bold">{experiences.length}</h2>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">Business Approvals</h2>

          {businesses.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-gray-500">
              No pending business registrations.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {businesses.map((business) => (
                <article key={business.id} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold">{business.name}</h3>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      Pending
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-gray-600">
                    {business.description || 'No description provided.'}
                  </p>

                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Address:</strong> {business.address}</p>
                    <p><strong>Area:</strong> {business.area || 'Not provided'}</p>
                    <p><strong>City:</strong> {business.city || 'Not provided'}</p>
                    <p><strong>Owner:</strong> {business.owner_name}</p>
                    <p><strong>Email:</strong> {business.owner_email}</p>
                    {business.contact_phone && (
                      <p><strong>Phone:</strong> {business.contact_phone}</p>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => updateStatus('businesses', business.id, 'approved')}
                      className="flex-1 rounded-full bg-lime-600 px-4 py-2 font-semibold text-white hover:bg-lime-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus('businesses', business.id, 'rejected')}
                      className="flex-1 rounded-full bg-red-100 px-4 py-2 font-semibold text-red-700 hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-bold">Experience Approvals</h2>

          {experiences.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-gray-500">
              No pending experiences.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {experiences.map((experience) => (
                <article key={experience.id} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold">{experience.title}</h3>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      Pending
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-gray-600">
                    {experience.description || 'No description provided.'}
                  </p>

                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Business:</strong> {experience.business_name}</p>
                    <p><strong>Category:</strong> {experience.category || 'Not specified'}</p>
                    <p><strong>Price:</strong> ₹{experience.price}</p>
                    <p><strong>Location:</strong> {experience.location}</p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => updateStatus('experiences', experience.id, 'approved')}
                      className="flex-1 rounded-full bg-lime-600 px-4 py-2 font-semibold text-white hover:bg-lime-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus('experiences', experience.id, 'rejected')}
                      className="flex-1 rounded-full bg-red-100 px-4 py-2 font-semibold text-red-700 hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
