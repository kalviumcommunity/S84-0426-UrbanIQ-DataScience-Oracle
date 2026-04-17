import axios from 'axios'
import { API_BASE_URL } from './config.js'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const STORAGE_KEY = 'urbaniq-complaints'

const seedComplaints = [
  {
    id: 'cmp-1001',
    title: 'Broken water pipe on MG Road',
    category: 'Water Supply',
    area: 'Ward 12',
    details: 'Water is leaking from the main pipe near the bus stop and flooding the lane.',
    submittedBy: 'Aarav Sharma',
    createdAt: '2026-04-08T08:15:00.000Z',
    status: 'in-progress',
  },
  {
    id: 'cmp-1002',
    title: 'Garbage not collected for 3 days',
    category: 'Garbage',
    area: 'Ward 5',
    details: 'Household waste has been piling up and the street now smells bad.',
    submittedBy: 'Neha Verma',
    createdAt: '2026-04-07T11:40:00.000Z',
    status: 'pending',
  },
  {
    id: 'cmp-1003',
    title: 'Large pothole near City Mall',
    category: 'Road Damage',
    area: 'Ward 8',
    details: 'The pothole is causing traffic slowdowns and is unsafe for two-wheelers.',
    submittedBy: 'Rohit Patel',
    createdAt: '2026-04-06T09:05:00.000Z',
    status: 'pending',
  },
  {
    id: 'cmp-1004',
    title: 'Street light not working',
    category: 'Street Lights',
    area: 'Ward 3',
    details: 'The lamp post near the park has been dark for almost a week.',
    submittedBy: 'Isha Khan',
    createdAt: '2026-04-05T18:20:00.000Z',
    status: 'resolved',
    resolvedAt: '2026-04-09T07:30:00.000Z',
  },
  {
    id: 'cmp-1005',
    title: 'Drainage overflow in market area',
    category: 'Drainage',
    area: 'Ward 15',
    details: 'Water overflow is blocking foot traffic near the vegetable market.',
    submittedBy: 'Kavya Singh',
    createdAt: '2026-04-04T13:55:00.000Z',
    status: 'pending',
  },
  {
    id: 'cmp-1006',
    title: 'Water supply disruption',
    category: 'Water Supply',
    area: 'Ward 7',
    details: 'Morning water supply has stopped for the last two days.',
    submittedBy: 'Farhan Ali',
    createdAt: '2026-04-03T07:10:00.000Z',
    status: 'resolved',
    resolvedAt: '2026-04-07T16:40:00.000Z',
  },
  {
    id: 'cmp-1007',
    title: 'Illegal dumping near school',
    category: 'Garbage',
    area: 'Ward 2',
    details: 'Construction debris is being dumped beside the school compound wall.',
    submittedBy: 'Meera Joshi',
    createdAt: '2026-04-02T15:30:00.000Z',
    status: 'in-progress',
  },
]

function cloneSeed() {
  return seedComplaints.map((complaint) => ({ ...complaint }))
}

function ensureLocalStore() {
  if (typeof window === 'undefined') {
    return cloneSeed()
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)

  if (!storedValue) {
    const initialValue = JSON.stringify(cloneSeed())
    window.localStorage.setItem(STORAGE_KEY, initialValue)
    return cloneSeed()
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    return Array.isArray(parsedValue) ? parsedValue : cloneSeed()
  } catch {
    const resetValue = cloneSeed()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resetValue))
    return resetValue
  }
}

function persistComplaints(complaints) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints))
  }
}

function normalizeComplaint(complaint) {
  const createdAt = complaint.createdAt ?? new Date().toISOString()
  const status = complaint.status ?? 'pending'
  const statusHistory =
    Array.isArray(complaint.statusHistory) && complaint.statusHistory.length
      ? complaint.statusHistory
      : buildDefaultStatusHistory({
          createdAt,
          resolvedAt: complaint.resolvedAt,
          status,
        })

  return {
    id: complaint.id,
    title: complaint.title,
    category: complaint.category,
    area: complaint.area,
    location: complaint.location ?? complaint.area,
    details: complaint.details,
    submittedBy: complaint.submittedBy,
    createdAt,
    resolvedAt: complaint.resolvedAt ?? null,
    status,
    priority: complaint.priority ?? 'medium',
    assignedTo: complaint.assignedTo ?? 'Unassigned',
    imageUrl: complaint.imageUrl ?? null,
    statusHistory,
  }
}

function buildDefaultStatusHistory({ createdAt, resolvedAt, status }) {
  const history = [
    { stage: 'submitted', at: createdAt },
    { stage: 'under-review', at: createdAt },
  ]

  if (status === 'in-progress' || status === 'resolved') {
    history.push({ stage: 'in-progress', at: createdAt })
  }

  if (status === 'resolved') {
    history.push({ stage: 'resolved', at: resolvedAt ?? new Date().toISOString() })
  }

  return history
}

function ensureStatusHistory(complaint) {
  if (Array.isArray(complaint.statusHistory) && complaint.statusHistory.length) {
    return complaint.statusHistory
  }

  return buildDefaultStatusHistory({
    createdAt: complaint.createdAt,
    resolvedAt: complaint.resolvedAt,
    status: complaint.status,
  })
}

function addHistoryEntry(history, stage, at) {
  if (history.some((entry) => entry.stage === stage)) {
    return history
  }

  return [...history, { stage, at }]
}

function getComplaintMetrics(complaints) {
  const total = complaints.length
  const resolved = complaints.filter((complaint) => complaint.status === 'resolved').length
  const pending = complaints.filter((complaint) => complaint.status === 'pending').length
  const inProgress = complaints.filter((complaint) => complaint.status === 'in-progress').length
  const averageResolutionTime = resolved
    ? `${(
        complaints.reduce((accumulator, complaint) => {
          if (!complaint.resolvedAt) {
            return accumulator
          }

          const openedAt = new Date(complaint.createdAt).getTime()
          const closedAt = new Date(complaint.resolvedAt).getTime()
          return accumulator + Math.max(closedAt - openedAt, 0)
        }, 0) / resolved / (1000 * 60 * 60 * 24)
      ).toFixed(1)} days`
    : '0.0 days'

  return {
    total,
    resolved,
    pending,
    inProgress,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    averageResolutionTime,
  }
}

function groupByMonth(complaints) {
  const counts = Array.from({ length: 12 }, (_, index) => ({
    month: new Date(2026, index, 1).toLocaleString('en-US', { month: 'short' }),
    value: 0,
  }))

  complaints.forEach((complaint) => {
    const createdAt = new Date(complaint.createdAt)

    if (!Number.isNaN(createdAt.getTime())) {
      counts[createdAt.getMonth()].value += 1
    }
  })

  return counts
}

function groupByCategory(complaints) {
  const categoryMap = new Map()

  complaints.forEach((complaint) => {
    const currentCount = categoryMap.get(complaint.category) ?? 0
    categoryMap.set(complaint.category, currentCount + 1)
  })

  const categoryPalette = ['#2ca8a1', '#2d9bd0', '#f2ac24', '#30b27a', '#7a5ac8', '#9ca3af']

  return Array.from(categoryMap.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: categoryPalette[index % categoryPalette.length],
  }))
}

export function fetchDashboardData() {
  return api.get('/dashboard')
}

export async function fetchComplaintsList() {
  const response = await api.get('/complaints')
  return { data: response.data?.data ?? [] }
}

export async function fetchNotifications(role) {
  const response = await api.get('/notifications', {
    params: {
      role: role === 'admin' ? 'admin' : 'citizen',
    },
  })
  return { data: response.data?.data ?? [] }
}

export function createComplaint(payload) {
  return api.post('/complaints', {
    title: payload.title,
    category: payload.category,
    area: payload.area,
    location: payload.location,
    details: payload.details,
    submittedBy: payload.submittedBy,
    priority: payload.priority ?? 'medium',
    assignedTo: payload.assignedTo ?? 'Unassigned',
    imageUrl: payload.imageUrl ?? null,
  })
}

export function resolveComplaint(complaintId) {
  return api.patch(`/complaints/${complaintId}/resolve`)
}

export function removeComplaint(complaintId) {
  return api.delete(`/complaints/${complaintId}`)
}

export function assignComplaint(complaintId, assignee) {
  return api.patch(`/complaints/${complaintId}/assign`, { assignedTo: assignee })
}

export function markAllPendingAsReviewed() {
  return api.patch('/complaints/actions/review-pending')
}

export async function fetchComplaintStore() {
  const response = await api.get('/complaints')
  return { data: response.data?.data ?? [] }
}

export async function predictComplaintCategory(text) {
  const response = await api.post('/predict-category', {
    complaint_text: text,
  })
  return response.data ?? {}
}

export async function fetchInsightsSummary() {
  const response = await api.get('/insights/summary')
  return response.data ?? {}
}

export default api