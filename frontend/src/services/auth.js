const SESSION_KEY = 'urbaniq-session'
const USERS_KEY = 'urbaniq-users'

const adminAccount = {
  email: 'admin@gmail.com',
  password: 'admin123',
  name: 'Admin',
  role: 'admin',
}

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

export function ensureUsersStore() {
  const storedUsers = readJson(USERS_KEY, null)

  if (Array.isArray(storedUsers)) {
    return storedUsers
  }

  const initialUsers = [
    adminAccount,
    {
      email: 'citizen@example.com',
      password: 'citizen123',
      name: 'Citizen Demo',
      role: 'citizen',
    },
  ]

  writeJson(USERS_KEY, initialUsers)
  return initialUsers
}

export function loginUser({ email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase()

  if (role === 'admin') {
    if (normalizedEmail !== adminAccount.email || password !== adminAccount.password) {
      throw new Error('Invalid admin credentials.')
    }

    const session = { user: { email: adminAccount.email, name: adminAccount.name, role: 'admin' } }
    writeJson(SESSION_KEY, session)
    return session
  }

  const users = ensureUsersStore()
  const matchedUser = users.find(
    (user) => user.role === 'citizen' && user.email.toLowerCase() === normalizedEmail && user.password === password,
  )

  if (!matchedUser) {
    throw new Error('Invalid citizen credentials.')
  }

  const session = { user: { email: matchedUser.email, name: matchedUser.name, role: 'citizen' } }
  writeJson(SESSION_KEY, session)
  return session
}

export function signupCitizen({ name, email, password }) {
  const users = ensureUsersStore()
  const normalizedEmail = email.trim().toLowerCase()

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email already exists.')
  }

  const newUser = {
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'citizen',
  }

  const nextUsers = [...users.filter((user) => user.role === 'admin'), ...users.filter((user) => user.role !== 'admin'), newUser]
  writeJson(USERS_KEY, nextUsers)

  const session = { user: { email: newUser.email, name: newUser.name, role: 'citizen' } }
  writeJson(SESSION_KEY, session)
  return session
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY)
  }
}

export function getDefaultRouteForRole(role) {
  return role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard'
}
