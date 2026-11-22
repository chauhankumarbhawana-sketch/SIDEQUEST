
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth`

function Signup() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountType, setAccountType] = useState<'user' | 'business'>('user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          accountType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      localStorage.setItem('sidequest_token', data.token)
      localStorage.setItem('sidequest_user', JSON.stringify(data.user))

      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f2] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">

        <Link to="/" className="text-2xl font-black tracking-tight text-[#20211e]">
          SIDEQUEST<span className="text-lime-600">.</span>
        </Link>

        <div className="bg-white rounded-3xl p-8 mt-8 shadow-sm border border-gray-100">

          <p className="text-sm font-bold uppercase tracking-widest text-lime-700">
            Join the adventure
          </p>

          <h1 className="text-3xl font-black mt-3 text-[#20211e]">
            Make every day a sidequest.
          </h1>

          <p className="text-gray-500 mt-3 text-sm">
            Create your account and start discovering places worth exploring.
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-4">

            <div>
              <label className="block text-sm font-semibold mb-3">
                I want to join SIDEQUEST as a
              </label>

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => setAccountType('user')}
                  className={`rounded-xl border p-4 text-left transition ${
                    accountType === 'user'
                      ? 'border-lime-600 bg-lime-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl">🧭</span>
                  <p className="font-bold mt-2 text-[#20211e]">
                    Explorer
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Discover places and experiences
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('business')}
                  className={`rounded-xl border p-4 text-left transition ${
                    accountType === 'business'
                      ? 'border-lime-600 bg-lime-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl">🏪</span>
                  <p className="font-bold mt-2 text-[#20211e]">
                    Business
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    List your business and experiences
                  </p>
                </button>

              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Phone number (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-lime-600"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#20211e] text-white rounded-xl py-3 font-bold hover:bg-lime-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-7">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-lime-700 hover:underline">
              Log in
            </Link>
          </p>

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Discover your kind of day.
        </p>

      </div>
    </div>
  )
}

export default Signup
