import api from './api.js'

const SESSION_KEY = 'urbaniq-session'

function readJson(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  const storedValue = window.localStorage.getItem(key)
  if (!storedValue) {
    return fallbackValue
  }

  try {
    return JSON.parse(storedValue)
  } catch {
    return fallbackValue
  }
}

function writeJson(key, value) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

export function getSession() {
  return readJson(SESSION_KEY, null)
}

export function getAuthUser() {
  return getSession()?.user ?? null
}

export function isAuthenticated() {
  return Boolean(getSession())
}

export function isAdminUser() {
  return getSession()?.user?.role === 'admin'
}

function extractErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.detail
    || error?.response?.data?.message
    || error?.response?.data?.error
    || error?.response?.statusText
    || error?.message
    || fallbackMessage
  )
}

function extractSessionData(payload) {
  return payload?.data ?? payload
}

export async function loginUser({ email, password }) {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    })
    console.log('Login API response:', response.data)
    const session = extractSessionData(response.data)
    writeJson(SESSION_KEY, session)
    return session
  } catch (error) {
    console.error('Login API error:', error?.response?.data || error)
    throw new Error(extractErrorMessage(error, 'Unable to log in right now.'))
  }
}

export async function signupCitizen({ name, email, password }) {
  try {
    const response = await api.post('/auth/signup', {
      name,
      email,
      password,
    })
    console.log('Signup API response:', response.data)
    const session = extractSessionData(response.data)
    writeJson(SESSION_KEY, session)
    return session
  } catch (error) {
    console.error('Signup API error:', error?.response?.data || error)
    throw new Error(extractErrorMessage(error, 'Unable to create your account right now.'))
  }
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY)
  }
}

export function getDefaultRouteForRole(role) {
  return role === 'admin' ? '/admin/overview' : '/citizen/dashboard'
}

export function getProfileRouteForRole(role) {
  return role === 'admin' ? '/admin/profile' : '/citizen/profile'
}
