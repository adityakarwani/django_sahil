import { useState, useEffect } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8000/api'

function App() {
  // Authentication state
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')
  const [currentView, setCurrentView] = useState(localStorage.getItem('token') ? 'dashboard' : 'login')
  
  // Loading and Error states
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form states
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', confirm_password: '' })
  
  // Profile / Person details state
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    age: '',
    phone: '',
    gender: 'Male',
    address: '',
    occupation: '',
    bio: ''
  })

  // Clear messages when view changes
  useEffect(() => {
    setErrorMsg('')
    setSuccessMsg('')
  }, [currentView])

  // Fetch profile when token is set
  useEffect(() => {
    if (token) {
      fetchProfile()
    }
  }, [token])

  const fetchProfile = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const response = await fetch(`${API_BASE_URL}/person-detail/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setProfileData(data)
        setIsEditing(false)
      } else if (response.status === 404) {
        // Details not filled yet
        setProfile(null)
        setIsEditing(true) // Show creation form
      } else {
        const err = await response.json()
        setErrorMsg(err.detail || 'Failed to fetch details')
      }
    } catch (error) {
      setErrorMsg('Could not connect to backend server. Please verify Django is running.')
    } finally {
      setIsLoading(false)
    }
  }

  // Auth actions
  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        setToken(data.token)
        setUsername(data.username)
        setCurrentView('dashboard')
        setLoginData({ username: '', password: '' })
      } else {
        setErrorMsg(data.non_field_errors?.[0] || 'Invalid username or password.')
      }
    } catch (error) {
      setErrorMsg('Server connection failed. Is the Django backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirm_password) {
      setErrorMsg('Passwords do not match.')
      return
    }
    setIsLoading(true)
    setErrorMsg('')
    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      })
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        setToken(data.token)
        setUsername(data.username)
        setCurrentView('dashboard')
        setRegisterData({ username: '', email: '', password: '', confirm_password: '' })
      } else {
        // Handle field specific validation errors from Django serializers
        const firstErrorKey = Object.keys(data)[0]
        const errorContent = data[firstErrorKey]
        const formattedErr = Array.isArray(errorContent) ? errorContent[0] : errorContent
        setErrorMsg(`${firstErrorKey}: ${formattedErr}`)
      }
    } catch (error) {
      setErrorMsg('Server connection failed. Is the Django backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken('')
    setUsername('')
    setProfile(null)
    setProfileData({
      full_name: '',
      age: '',
      phone: '',
      gender: 'Male',
      address: '',
      occupation: '',
      bio: ''
    })
    setCurrentView('login')
  }

  // Profile save action
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const response = await fetch(`${API_BASE_URL}/person-detail/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })
      const data = await response.json()
      
      if (response.ok) {
        setProfile(data)
        setProfileData(data)
        setIsEditing(false)
        setSuccessMsg('Details saved successfully!')
      } else {
        const firstErrorKey = Object.keys(data)[0]
        const errorContent = data[firstErrorKey]
        const formattedErr = Array.isArray(errorContent) ? errorContent[0] : errorContent
        setErrorMsg(`Failed to save details: ${firstErrorKey} - ${formattedErr}`)
      }
    } catch (error) {
      setErrorMsg('Failed to connect to server to save details.')
    } finally {
      setIsLoading(false)
    }
  }

  // Input change handlers
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value })
  }

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value })
  }

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value })
  }

  return (
    <>
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="logo-container">
          <div className="logo-icon">🪪</div>
          <span className="logo-text">IdentityHQ</span>
        </div>
        <div className="nav-actions">
          {token ? (
            <>
              <div className="user-badge">
                <div className="user-avatar">{username[0]?.toUpperCase()}</div>
                <span>{username}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', width: 'auto', fontSize: '0.85rem' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '0.25rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </>
          ) : (
            currentView === 'login' ? (
              <button onClick={() => setCurrentView('register')} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', width: 'auto', fontSize: '0.85rem' }}>
                Create Account
              </button>
            ) : (
              <button onClick={() => setCurrentView('login')} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', width: 'auto', fontSize: '0.85rem' }}>
                Sign In
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-container">
        
        {/* Auth: Login View */}
        {currentView === 'login' && (
          <div className="auth-wrapper">
            <div className="glass-card auth-card">
              <div className="auth-header">
                <h2>Welcome Back</h2>
                <p>Enter your credentials to access your account</p>
              </div>

              {errorMsg && <div className="alert alert-error">⚠️ {errorMsg}</div>}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label" htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    placeholder="Enter your username"
                    className="form-input"
                    value={loginData.username}
                    onChange={handleLoginChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    className="form-input"
                    value={loginData.password}
                    onChange={handleLoginChange}
                  />
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: '1.5rem' }}>
                  {isLoading ? <div className="spinner"></div> : 'Sign In'}
                </button>
              </form>

              <div className="auth-footer">
                Don't have an account?{' '}
                <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setCurrentView('register'); }}>
                  Create one now
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Auth: Register View */}
        {currentView === 'register' && (
          <div className="auth-wrapper">
            <div className="glass-card auth-card">
              <div className="auth-header">
                <h2>Create Account</h2>
                <p>Register today to manage your details</p>
              </div>

              {errorMsg && <div className="alert alert-error">⚠️ {errorMsg}</div>}

              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-username">Username</label>
                  <input
                    type="text"
                    id="reg-username"
                    name="username"
                    required
                    placeholder="e.g. john_doe"
                    className="form-input"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email Address</label>
                  <input
                    type="email"
                    id="reg-email"
                    name="email"
                    required
                    placeholder="john@example.com"
                    className="form-input"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">Password</label>
                  <input
                    type="password"
                    id="reg-password"
                    name="password"
                    required
                    placeholder="At least 6 characters"
                    className="form-input"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                  <input
                    type="password"
                    id="reg-confirm"
                    name="confirm_password"
                    required
                    placeholder="Re-enter password"
                    className="form-input"
                    value={registerData.confirm_password}
                    onChange={handleRegisterChange}
                  />
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: '1.5rem' }}>
                  {isLoading ? <div className="spinner"></div> : 'Register Account'}
                </button>
              </form>

              <div className="auth-footer">
                Already have an account?{' '}
                <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); setCurrentView('login'); }}>
                  Sign in instead
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div>
            <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
              <h1 className="dashboard-title">Profile Dashboard</h1>
              <p className="dashboard-subtitle">Manage, view, and update your personal credentials securely.</p>
            </div>

            {errorMsg && <div className="alert alert-error">⚠️ {errorMsg}</div>}
            {successMsg && <div className="alert alert-success">✓ {successMsg}</div>}

            {isLoading && !profile && (
              <div className="spinner spinner-primary"></div>
            )}

            {!isLoading && (
              <div className="dashboard-grid">
                
                {/* Left Column: Profile Card (Only if profile details filled) */}
                <div className="glass-card profile-card" style={{ height: '100%' }}>
                  {profile ? (
                    <>
                      <div className="profile-avatar-large">
                        {profile.full_name[0]?.toUpperCase() || username[0]?.toUpperCase()}
                      </div>
                      <h3 className="profile-name">{profile.full_name}</h3>
                      <p className="profile-occupation">{profile.occupation || 'No occupation specified'}</p>
                      <p className="profile-bio">
                        "{profile.bio || 'Your bio will appear here. Click Edit Profile details to add it.'}"
                      </p>
                      
                      <div className="profile-divider"></div>
                      
                      <div className="profile-info-list">
                        <div className="profile-info-item">
                          <span className="profile-info-label">Member Username</span>
                          <span className="profile-info-value">{username}</span>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Account Verification</span>
                          <span className="profile-info-value" style={{ color: 'var(--color-success)', fontWeight: '600' }}>Verified</span>
                        </div>
                      </div>

                      {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Profile Details
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">📝</div>
                      <h3>No details found</h3>
                      <p>You have not filled in your personal details yet. Please complete the form to create your identity profile.</p>
                      <span className="badge">Draft Account</span>
                    </div>
                  )}
                </div>

                {/* Right Column: Profile display or Form */}
                <div className="glass-card">
                  {isEditing ? (
                    <>
                      <div className="section-title-bar">
                        <span className="section-title">
                          {profile ? 'Update Personal Details' : 'Fill Personal Details'}
                        </span>
                        <span className="badge">Required Details</span>
                      </div>
                      
                      <form onSubmit={handleProfileSubmit}>
                        <div className="form-group">
                          <label className="form-label" htmlFor="full_name">Full Name</label>
                          <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            required
                            placeholder="Enter your full name"
                            className="form-input"
                            value={profileData.full_name}
                            onChange={handleProfileChange}
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label" htmlFor="age">Age</label>
                            <input
                              type="number"
                              id="age"
                              name="age"
                              required
                              placeholder="e.g. 25"
                              min="0"
                              max="150"
                              className="form-input"
                              value={profileData.age}
                              onChange={handleProfileChange}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label" htmlFor="gender">Gender</label>
                            <select
                              id="gender"
                              name="gender"
                              required
                              className="form-input"
                              value={profileData.gender}
                              onChange={handleProfileChange}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label" htmlFor="phone">Phone Number</label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              required
                              placeholder="e.g. +91 9876543210"
                              className="form-input"
                              value={profileData.phone}
                              onChange={handleProfileChange}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label" htmlFor="occupation">Occupation</label>
                            <input
                              type="text"
                              id="occupation"
                              name="occupation"
                              required
                              placeholder="e.g. Software Engineer"
                              className="form-input"
                              value={profileData.occupation}
                              onChange={handleProfileChange}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="address">Address</label>
                          <textarea
                            id="address"
                            name="address"
                            required
                            placeholder="Your full home or office address"
                            className="form-input"
                            value={profileData.address}
                            onChange={handleProfileChange}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="bio">Brief Bio</label>
                          <textarea
                            id="bio"
                            name="bio"
                            placeholder="Tell us a bit about yourself..."
                            className="form-input"
                            value={profileData.bio}
                            onChange={handleProfileChange}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                          {profile && (
                            <button type="button" onClick={() => { setIsEditing(false); setProfileData(profile); }} className="btn btn-secondary" style={{ flex: 1 }}>
                              Cancel
                            </button>
                          )}
                          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ flex: 2 }}>
                            {isLoading ? <div className="spinner"></div> : 'Save Profile'}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    profile && (
                      <>
                        <div className="section-title-bar">
                          <span className="section-title">Personal Credentials</span>
                          <span className="badge badge-green">✓ Filled</span>
                        </div>

                        <div className="profile-info-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: 0 }}>
                          <div className="profile-info-item" style={{ gridColumn: 'span 2' }}>
                            <span className="profile-info-label">Full Name</span>
                            <span className="profile-info-value" style={{ fontSize: '1.2rem', fontWeight: '600' }}>{profile.full_name}</span>
                          </div>
                          
                          <div className="profile-info-item">
                            <span className="profile-info-label">Age</span>
                            <span className="profile-info-value">{profile.age} Years</span>
                          </div>

                          <div className="profile-info-item">
                            <span className="profile-info-label">Gender</span>
                            <span className="profile-info-value">{profile.gender}</span>
                          </div>

                          <div className="profile-info-item">
                            <span className="profile-info-label">Phone Number</span>
                            <span className="profile-info-value">{profile.phone}</span>
                          </div>

                          <div className="profile-info-item">
                            <span className="profile-info-label">Occupation</span>
                            <span className="profile-info-value">{profile.occupation}</span>
                          </div>

                          <div className="profile-info-item" style={{ gridColumn: 'span 2' }}>
                            <span className="profile-info-label">Full Address</span>
                            <span className="profile-info-value" style={{ lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                              {profile.address}
                            </span>
                          </div>

                          <div className="profile-info-item" style={{ gridColumn: 'span 2' }}>
                            <span className="profile-info-label">User Bio</span>
                            <span className="profile-info-value" style={{ lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontStyle: 'italic' }}>
                              {profile.bio || 'No bio provided'}
                            </span>
                          </div>
                        </div>
                      </>
                    )
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}

export default App
