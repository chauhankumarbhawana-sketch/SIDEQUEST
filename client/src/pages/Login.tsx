
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:5000/api/auth'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
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
            Welcome back
          </p>

          <h1 className="text-3xl font-black mt-3 text-[#20211e]">
            Your next adventure awaits.
          </h1>

          <p className="text-gray-500 mt-3 text-sm">
            Log in to discover more, save places and plan your next outing.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Email address
              </label>

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
              <label className="block text-sm font-semibold mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
              {loading ? 'Logging in...' : 'Log In →'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-7">
            New to SIDEQUEST?{' '}
            <Link to="/signup" className="font-bold text-lime-700 hover:underline">
              Create an account
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

export default Login
