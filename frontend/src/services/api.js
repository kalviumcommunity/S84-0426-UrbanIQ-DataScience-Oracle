import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
})

export function fetchDashboardData() {
  return api.get('/dashboard')
}

export function fetchComplaintsList() {
  return api.get('/complaints')
}

export default api